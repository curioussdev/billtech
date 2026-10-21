'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { formatEUR } from '@/lib/admin/format'
import { createInvoiceForDeal } from '@/lib/finance/deal-invoice'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createAdminClient } from '@/lib/supabase/server'
import { DEAL_PROJECT_TYPES, LOSS_REASONS } from '@/types/crm'
import { PAYMENT_TYPES } from '@/types/finance'
import { LEAD_STAGES } from '@/types/lead'
import { PROJECT_STATUSES } from '@/types/project'

/** Mesmo critério de `src/lib/admin/analytics.ts`: só grava a sério com Supabase configurado + service role key. */
const isLive = () => isSupabaseConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

/**
 * Antes da migração `supabase/007_leads.sql` (ou do seed inicial) a tabela `leads` ainda não existe:
 * trata-se como "ainda não está ligado", não como falha — o Pipeline continua a funcionar em modo
 * mock, exatamente como hoje, em vez de mostrar um erro ao utilizador por uma tabela que falta.
 */
const isMissingTable = (error: { code?: string } | null) => error?.code === '42P01'

const schema = z.object({ leadId: z.string().min(1).max(60), stage: z.enum(LEAD_STAGES) })

export type LeadMoveResult = { ok: true } | { ok: false; message: string }

/**
 * Move um lead de etapa do funil (etapas intermédias, não terminais — fechar como Ganho/Perdido
 * passa por `markDealWon`/`markDealLost`, que captam os dados do negócio e ficam auditados).
 *
 * Grava a sério na tabela `leads` (supabase/007_leads.sql) quando configurada; sem base de dados (ou
 * antes da migração/seed), a mudança só existe na sessão do browser e o Pipeline volta aos dados de
 * demonstração ao atualizar a página. Não auditamos estas trocas intermédias para não encher a trilha
 * imutável com dados de demonstração.
 */
export async function moveLead(leadId: string, stage: string): Promise<LeadMoveResult> {
  await requireAdmin()
  const parsed = schema.safeParse({ leadId, stage })
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' }

  if (isLive()) {
    const { error } = await createAdminClient()
      .from('leads')
      .update({ stage: parsed.data.stage, stage_entered_at: new Date().toISOString() })
      .eq('id', parsed.data.leadId)
    if (error && !isMissingTable(error)) {
      console.error('[pipeline] atualização de etapa falhou:', error)
      return { ok: false, message: 'Não foi possível guardar a mudança de etapa.' }
    }
  }
  return { ok: true }
}

const proposalSchema = z.object({
  leadId: z.string().min(1).max(60),
  leadLabel: z.string().min(1).max(160),
  value: z.coerce.number('Indique um valor.').min(0).max(1_000_000),
  validUntil: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
})

export type ProposalResult = { ok: true } | { ok: false; message: string }

/**
 * Envia a proposta: move para "Proposta Enviada" e fixa o valor proposto (pode ser diferente do
 * valor estimado inicial). Fica registado como interação, para ficar no histórico e alimentar o
 * "próxima ação" do cartão — não sobrescrevemos o valor outra vez sem rasto quando o negócio for
 * fechado (o valor final do negócio, possivelmente diferente após negociação, é capturado à parte
 * em "Marcar como Ganho").
 */
export async function sendProposal(input: unknown): Promise<ProposalResult> {
  const admin = await requireAdmin()
  const parsed = proposalSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  const { leadId, leadLabel, value, validUntil, notes } = parsed.data

  if (isLive()) {
    const db = createAdminClient()
    const { error } = await db.from('leads').update({ stage: 'proposta', stage_entered_at: new Date().toISOString(), estimated_value: value }).eq('id', leadId)
    if (error && !isMissingTable(error)) {
      console.error('[pipeline] envio de proposta falhou:', error)
      return { ok: false, message: 'Não foi possível registar a proposta.' }
    }

    const noteParts = [`Proposta enviada: ${formatEUR(value)}`]
    if (validUntil) noteParts.push(`válida até ${new Date(validUntil).toLocaleDateString('pt-PT', { timeZone: 'UTC' })}`)
    if (notes) noteParts.push(notes)

    const { error: interactionError } = await db.from('interactions').insert({
      lead_id: leadId,
      lead_label: leadLabel,
      type: 'email',
      occurred_at: new Date().toISOString(),
      outcome: 'interessado',
      notes: noteParts.join(' · '),
      next_step: validUntil ? `Fazer follow-up até ${new Date(validUntil).toLocaleDateString('pt-PT', { timeZone: 'UTC' })}` : '',
      admin_id: admin.id,
      admin_email: admin.email,
    })
    if (interactionError) console.error('[pipeline] registo da interação de proposta falhou:', interactionError)
  }

  return { ok: true }
}

const linkClientSchema = z.object({ leadId: z.string().min(1).max(60), clientId: z.uuid().nullable() })

/**
 * Associa (ou desassocia) um lead a uma conta de cliente já existente no portal — mesma empresa em
 * dois sítios diferentes. Se o negócio já tinha uma forma de pagamento acordada (ao fechar como
 * Ganho) mas ainda sem fatura — porque nessa altura ainda não havia conta de cliente —, associar o
 * cliente agora gera essa fatura, em vez de ficar perdida à espera de alguém se lembrar.
 */
export async function linkLeadToClient(leadId: string, clientId: string | null): Promise<LeadMoveResult> {
  const admin = await requireAdmin()
  const parsed = linkClientSchema.safeParse({ leadId, clientId })
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' }

  const db = createAdminClient()
  const { error } = await db.from('leads').update({ client_id: parsed.data.clientId }).eq('id', parsed.data.leadId)
  if (error) return { ok: false, message: 'Não foi possível associar o cliente.' }

  await logAudit({ admin, action: 'LINK_LEAD_CLIENT', resource: 'negocio', targetId: parsed.data.leadId, details: { clientId: parsed.data.clientId } })

  if (parsed.data.clientId) {
    const { data: lead } = await db.from('leads').select('project_name, estimated_value, payment_type, payment_installments, invoice_id').eq('id', parsed.data.leadId).maybeSingle()
    if (lead && lead.payment_type && !lead.invoice_id) {
      const result = await createInvoiceForDeal(db, {
        clientId: parsed.data.clientId,
        description: lead.project_name ?? 'Projeto',
        amount: lead.estimated_value,
        paymentType: lead.payment_type,
        installments: lead.payment_installments,
        dueDate: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
      })
      if ('invoiceId' in result) {
        await db.from('leads').update({ invoice_id: result.invoiceId }).eq('id', parsed.data.leadId)
        await logAudit({ admin, action: 'CREATE_INVOICE', resource: 'financeiro', targetId: result.invoiceId, details: { leadId: parsed.data.leadId, fromDealLink: true } })
      } else {
        console.error('[pipeline] criação da fatura (ao associar cliente) falhou:', result.error)
      }
    }
  }

  return { ok: true }
}

const winSchema = z
  .object({
    leadId: z.string().min(1).max(60),
    leadLabel: z.string().min(1).max(160),
    projectName: z.string().trim().min(2, 'Indique o nome do projeto.').max(120),
    projectType: z.enum(DEAL_PROJECT_TYPES, 'Escolha o tipo de projeto.'),
    value: z.coerce.number('Indique um valor.').min(0, 'O valor não pode ser negativo.').max(1_000_000),
    /** Opcional: forma de pagamento acordada. Quando indicada, gera logo a fatura (se já houver conta de cliente associada). */
    paymentType: z.enum(PAYMENT_TYPES).optional(),
    installments: z.coerce.number().int().min(2).max(12).optional(),
    dueDate: z.iso.date().optional(),
  })
  .refine((v) => v.paymentType !== 'parcelado' || v.installments !== undefined, { message: 'Indique o número de parcelas.' })
  .refine((v) => v.paymentType === undefined || v.dueDate !== undefined, { message: 'Indique a data de vencimento.' })

export type DealCloseResult = { ok: true; invoiceCreated: boolean } | { ok: false; message: string }

/**
 * Fecha um negócio como Ganho: confirma projeto, tipo e valor — e, opcionalmente, a forma de
 * pagamento acordada (único ou em parcelas). Quando o negócio já tem uma conta de cliente associada
 * (`leads.client_id`, via `linkLeadToClient`), a fatura é criada já ali, refletindo logo no
 * financeiro e em "Receita & Projetos"; sem conta associada ainda, a forma de pagamento fica
 * guardada no negócio e a fatura só é criada quando o cliente for associado (ver `linkLeadToClient`).
 * Fica auditado (ação de negócio relevante) e grava a sério na tabela `leads` quando configurada.
 */
export async function markDealWon(input: unknown): Promise<DealCloseResult> {
  const admin = await requireAdmin()
  const parsed = winSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  const { leadId, projectName, projectType, value, paymentType, installments, dueDate } = parsed.data
  let invoiceCreated = false

  if (isLive()) {
    const db = createAdminClient()
    const { data: existing } = await db.from('leads').select('client_id').eq('id', leadId).maybeSingle()
    const { error } = await db
      .from('leads')
      .update({
        stage: 'ganho',
        stage_entered_at: new Date().toISOString(),
        project_name: projectName,
        project_type: projectType,
        estimated_value: value,
        delivery_status: 'em_desenvolvimento',
        payment_type: paymentType ?? null,
        payment_installments: paymentType === 'parcelado' ? installments : null,
      })
      .eq('id', leadId)
    if (error && !isMissingTable(error)) {
      console.error('[pipeline] gravação de negócio ganho falhou:', error)
      return { ok: false, message: 'Não foi possível guardar o negócio ganho.' }
    }

    if (paymentType && existing?.client_id && dueDate) {
      const result = await createInvoiceForDeal(db, { clientId: existing.client_id, description: projectName, amount: value, paymentType, installments: installments ?? null, dueDate })
      if ('invoiceId' in result) {
        await db.from('leads').update({ invoice_id: result.invoiceId }).eq('id', leadId)
        await logAudit({ admin, action: 'CREATE_INVOICE', resource: 'financeiro', targetId: result.invoiceId, details: { leadId, fromDealWin: true } })
        invoiceCreated = true
      } else {
        console.error('[pipeline] criação da fatura (ao fechar negócio) falhou:', result.error)
      }
    }
  }

  await logAudit({ admin, action: 'MARK_DEAL_WON', resource: 'negocio', targetId: leadId, details: parsed.data })
  return { ok: true, invoiceCreated }
}

const lossSchema = z.object({
  leadId: z.string().min(1).max(60),
  leadLabel: z.string().min(1).max(160),
  reason: z.enum(LOSS_REASONS, 'Escolha um motivo.'),
})

/**
 * Fecha um negócio como Perdido: exige o motivo. Fica auditado (ação de negócio relevante) e grava a
 * sério na tabela `leads` quando configurada.
 */
export async function markDealLost(input: unknown): Promise<LeadMoveResult> {
  const admin = await requireAdmin()
  const parsed = lossSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  if (isLive()) {
    const { error } = await createAdminClient()
      .from('leads')
      .update({ stage: 'perdido', stage_entered_at: new Date().toISOString(), loss_reason: parsed.data.reason })
      .eq('id', parsed.data.leadId)
    if (error && !isMissingTable(error)) {
      console.error('[pipeline] gravação de negócio perdido falhou:', error)
      return { ok: false, message: 'Não foi possível guardar o negócio perdido.' }
    }
  }

  await logAudit({ admin, action: 'MARK_DEAL_LOST', resource: 'negocio', targetId: parsed.data.leadId, details: parsed.data })
  return { ok: true }
}

const deliverySchema = z.object({
  leadId: z.string().min(1).max(60),
  deliveryStatus: z.enum(PROJECT_STATUSES),
  marginPct: z.coerce.number('Indique a margem.').min(0).max(100),
  deliveredAt: z.string().optional(),
})

/**
 * Atualiza a entrega de um negócio já ganho (estado, margem e data de entrega) — é o que alimenta
 * "Receita & Projetos" com dados reais em vez dos de demonstração.
 */
export async function updateDealDelivery(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const parsed = deliverySchema.safeParse({
    leadId: formData.get('leadId'),
    deliveryStatus: formData.get('deliveryStatus'),
    marginPct: formData.get('marginPct'),
    deliveredAt: formData.get('deliveredAt') || undefined,
  })
  if (!parsed.success) return
  const { leadId, deliveryStatus, marginPct } = parsed.data
  const deliveredAt = deliveryStatus === 'entregue' ? (parsed.data.deliveredAt ?? new Date().toISOString().slice(0, 10)) : null

  if (isLive()) {
    const { error } = await createAdminClient()
      .from('leads')
      .update({ delivery_status: deliveryStatus, margin_pct: marginPct, delivered_at: deliveredAt })
      .eq('id', leadId)
      .eq('stage', 'ganho')
    if (error && !isMissingTable(error)) {
      console.error('[pipeline] atualização de entrega falhou:', error)
      return
    }
  }

  await logAudit({ admin, action: 'UPDATE_DEAL_DELIVERY', resource: 'negocio', targetId: leadId, details: { deliveryStatus, marginPct, deliveredAt } })
  revalidatePath('/admin/pipeline')
  revalidatePath('/admin')
  revalidatePath('/admin/revenue')
  redirect('/admin/revenue')
}

const noteSchema = z.object({ leadId: z.string().min(1).max(60), leadLabel: z.string().min(1).max(160), note: z.string().trim().min(1, 'Escreva a nota.').max(1000) })

export type AddNoteResult = { ok: true } | { ok: false; message: string }

/**
 * Nota opcional sobre a última interação com o lead — não está presa a nenhuma etapa, fica
 * disponível em qualquer altura do Pipeline. Reaproveita `interactions` (mesma tabela do Fast-Log),
 * com tipo/resultado neutros, para alimentar o mesmo histórico e "próxima ação" do cartão.
 */
export async function addLeadNote(input: unknown): Promise<AddNoteResult> {
  const admin = await requireAdmin()
  const parsed = noteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  if (isLive()) {
    const { error } = await createAdminClient().from('interactions').insert({
      lead_id: parsed.data.leadId,
      lead_label: parsed.data.leadLabel,
      type: 'follow_up',
      occurred_at: new Date().toISOString(),
      outcome: 'interessado',
      notes: parsed.data.note,
      next_step: '',
      admin_id: admin.id,
      admin_email: admin.email,
    })
    if (error && !isMissingTable(error)) {
      console.error('[pipeline] registo de nota falhou:', error)
      return { ok: false, message: 'Não foi possível guardar a nota.' }
    }
  }

  revalidatePath('/admin/pipeline')
  revalidatePath('/admin/prospecting')
  return { ok: true }
}
