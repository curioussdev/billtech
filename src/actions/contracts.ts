'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { siteUrl } from '@/data/site'
import { logAudit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { sendEmail } from '@/lib/contact-delivery'
import { emailLayout, escapeHtml } from '@/lib/email-template'
import { createAdminClient } from '@/lib/supabase/server'
import { PAYMENT_TYPES } from '@/types/finance'

const sendContractSchema = z
  .object({
    projectId: z.uuid(),
    scope: z.string().trim().min(10, 'Descreva o âmbito do projeto.').max(2000),
    totalAmount: z.coerce.number('Indique um valor.').min(0).max(1_000_000),
    paymentType: z.enum(PAYMENT_TYPES),
    installments: z.coerce.number().int().min(2).max(12).optional(),
    startDate: z.iso.date(),
    dueDate: z.iso.date().optional(),
  })
  .refine((v) => v.paymentType !== 'parcelado' || v.installments !== undefined, { message: 'Indique o número de parcelas.' })

export type ContractResult = { ok: true } | { ok: false; message: string }

/**
 * Grava o contrato definitivo deste projeto (substitui qualquer versão anterior — não acumula
 * histórico, o que conta de verdade é o PDF assinado carregado à parte) e notifica o cliente por
 * email, com um link para a sua própria página de contrato na área de cliente. A assinatura em si
 * continua a ser feita fora da plataforma (imprimir, assinar, devolver) — isto só gera e envia.
 */
export async function sendContractToClient(input: unknown): Promise<ContractResult> {
  const admin = await requireAdmin()
  const parsed = sendContractSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  const { projectId, scope, totalAmount, paymentType, installments, startDate, dueDate } = parsed.data

  const db = createAdminClient()
  const { data: project } = await db.from('client_projects').select('id, client_id, name').eq('id', projectId).maybeSingle()
  if (!project) return { ok: false, message: 'Projeto não encontrado.' }

  const { data: client } = await db.from('profiles').select('email').eq('id', project.client_id).maybeSingle()
  if (!client) return { ok: false, message: 'Cliente não encontrado.' }

  const now = new Date().toISOString()
  const { error } = await db.from('contracts').upsert(
    {
      project_id: project.id,
      client_id: project.client_id,
      project_name: project.name,
      scope,
      total_amount: totalAmount,
      payment_type: paymentType,
      installments: paymentType === 'parcelado' ? (installments ?? null) : null,
      start_date: startDate,
      due_date: dueDate ?? null,
      status: 'enviado',
      created_by: admin.id,
      sent_at: now,
    },
    { onConflict: 'project_id' },
  )
  if (error) {
    console.error('[contracts] gravação do contrato falhou:', error)
    return { ok: false, message: 'Não foi possível guardar o contrato.' }
  }

  try {
    await sendEmail({
      to: client.email,
      subject: `Contrato para assinatura — ${project.name}`,
      html: emailLayout({
        title: 'O seu contrato está pronto',
        bodyHtml: `<p style="margin:0 0 12px">Preparámos o contrato de prestação de serviços para o projeto «${escapeHtml(project.name)}». Reveja os termos e siga as instruções para assinatura.</p>`,
        cta: { label: 'Ver contrato', href: `${siteUrl}/area-cliente/projetos/${project.id}/contrato` },
        footer: 'Recebeu este email porque tem um projeto ativo na BillTech.',
      }),
    })
  } catch (emailError) {
    console.error('[contracts] email ao cliente falhou (contrato já foi guardado):', emailError)
  }

  await logAudit({ admin, action: 'SEND_CONTRACT', resource: 'projetos_cliente', targetId: project.id, details: { clientId: project.client_id, totalAmount, paymentType, installments } })
  revalidatePath(`/admin/clientes/${project.client_id}`)
  revalidatePath(`/area-cliente/projetos/${project.id}`)
  revalidatePath(`/area-cliente/projetos/${project.id}/contrato`)
  return { ok: true }
}
