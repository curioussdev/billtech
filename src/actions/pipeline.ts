'use server'

import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createAdminClient } from '@/lib/supabase/server'
import { DEAL_PROJECT_TYPES, LOSS_REASONS } from '@/types/crm'
import { LEAD_STAGES } from '@/types/lead'

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

const winSchema = z.object({
  leadId: z.string().min(1).max(60),
  leadLabel: z.string().min(1).max(160),
  projectName: z.string().trim().min(2, 'Indique o nome do projeto.').max(120),
  projectType: z.enum(DEAL_PROJECT_TYPES, 'Escolha o tipo de projeto.'),
  value: z.coerce.number('Indique um valor.').min(0, 'O valor não pode ser negativo.').max(1_000_000),
})

export type DealCloseResult = { ok: true } | { ok: false; message: string }

/**
 * Fecha um negócio como Ganho: confirma projeto, tipo e valor. Fica auditado (ação de negócio
 * relevante) e grava a sério na tabela `leads` quando configurada.
 */
export async function markDealWon(input: unknown): Promise<DealCloseResult> {
  const admin = await requireAdmin()
  const parsed = winSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  if (isLive()) {
    const { error } = await createAdminClient()
      .from('leads')
      .update({
        stage: 'ganho',
        stage_entered_at: new Date().toISOString(),
        project_name: parsed.data.projectName,
        project_type: parsed.data.projectType,
        estimated_value: parsed.data.value,
      })
      .eq('id', parsed.data.leadId)
    if (error && !isMissingTable(error)) {
      console.error('[pipeline] gravação de negócio ganho falhou:', error)
      return { ok: false, message: 'Não foi possível guardar o negócio ganho.' }
    }
  }

  await logAudit({ admin, action: 'MARK_DEAL_WON', resource: 'negocio', targetId: parsed.data.leadId, details: parsed.data })
  return { ok: true }
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
export async function markDealLost(input: unknown): Promise<DealCloseResult> {
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
