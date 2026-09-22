'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { FORBIDDEN_MESSAGE, requireSuperAdminForAction, requireUser } from '@/lib/auth'
import { getRecipient, sendEmailBatch } from '@/lib/contact-delivery'
import { buildBroadcastEmail } from '@/lib/portal/notify'
import { createAdminClient } from '@/lib/supabase/server'

export type BroadcastState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  broadcastId?: string
  fieldErrors?: Record<string, string>
  values?: { subject?: string; body?: string }
}

const MAX_RECIPIENTS = 500

const schema = z.object({
  subject: z.string().trim().min(3, 'Escreva um assunto (mínimo 3 caracteres).').max(150, 'Máximo de 150 caracteres.'),
  body: z.string().trim().min(10, 'Escreva a mensagem (mínimo 10 caracteres).').max(5000, 'Máximo de 5000 caracteres.'),
  mode: z.enum(['all', 'selected']),
})

const text = (fd: FormData, key: string) => {
  const v = fd.get(key)
  return typeof v === 'string' ? v : ''
}

/**
 * Envia um comunicado a um cliente, a vários ou a todos. Aparece no portal (Mensagens) e, se pedido, chega por email.
 * Ação crítica (comunicação em massa): só Super Admins, e fica registada na auditoria.
 */
export async function sendBroadcast(_prev: BroadcastState, formData: FormData): Promise<BroadcastState> {
  const admin = await requireSuperAdminForAction({ action: 'SEND_BROADCAST', resource: 'comunicacoes' })
  if (!admin) return { status: 'error', message: FORBIDDEN_MESSAGE }

  const values = { subject: text(formData, 'subject'), body: text(formData, 'body') }
  const parsed = schema.safeParse({ ...values, mode: text(formData, 'mode') })
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const [k, v] of Object.entries(z.flattenError(parsed.error).fieldErrors)) fieldErrors[k] = (v as string[])[0]
    return { status: 'error', message: 'Corrija os campos assinalados.', fieldErrors, values }
  }

  const selectedIds = z.array(z.uuid()).safeParse(formData.getAll('recipient').map(String))
  if (parsed.data.mode === 'selected' && (!selectedIds.success || selectedIds.data.length === 0)) {
    return { status: 'error', message: 'Escolha pelo menos um cliente.', values }
  }
  const wantsEmail = text(formData, 'sendEmail') === 'on'

  const db = createAdminClient()

  // Só contas de cliente: nunca administradores nem ids inventados
  let query = db.from('profiles').select('id, email, full_name').eq('role', 'client')
  if (parsed.data.mode === 'selected' && selectedIds.success) query = query.in('id', selectedIds.data)
  const { data: clients, error: clientsError } = await query
  if (clientsError) return { status: 'error', message: 'Não foi possível obter os clientes.', values }
  if (!clients || clients.length === 0) return { status: 'error', message: 'Não há clientes para receber a mensagem.', values }
  if (clients.length > MAX_RECIPIENTS) return { status: 'error', message: `Máximo de ${MAX_RECIPIENTS} destinatários por envio.`, values }

  const { data: broadcast, error } = await db
    .from('broadcasts')
    .insert({ admin_id: admin.id, admin_email: admin.email, subject: parsed.data.subject, body: parsed.data.body, audience: parsed.data.mode, recipient_count: clients.length, email_requested: wantsEmail })
    .select('id')
    .single()
  if (error || !broadcast) {
    console.error('[broadcast] insert:', error)
    return { status: 'error', message: 'Não foi possível guardar a mensagem.', values }
  }

  const { error: recipientsError } = await db.from('broadcast_recipients').insert(clients.map((c) => ({ broadcast_id: broadcast.id, client_id: c.id, email_status: 'skipped' as const })))
  if (recipientsError) {
    console.error('[broadcast] destinatários:', recipientsError)
    await db.from('broadcasts').delete().eq('id', broadcast.id) // evita um comunicado sem destinatários
    return { status: 'error', message: 'Não foi possível registar os destinatários.', values }
  }

  // Emails (opcional): em lote, personalizados; o estado de cada um fica guardado
  let sent = 0
  let failed = 0
  if (wantsEmail) {
    const replyTo = await getRecipient()
    const results = await sendEmailBatch(
      clients.map((c) => ({ to: c.email, replyTo, subject: parsed.data.subject, html: buildBroadcastEmail(parsed.data.subject, parsed.data.body, c.full_name, broadcast.id) })),
    )
    const okIds = clients.filter((_, i) => results[i]).map((c) => c.id)
    const failIds = clients.filter((_, i) => !results[i]).map((c) => c.id)
    sent = okIds.length
    failed = failIds.length
    if (okIds.length) await db.from('broadcast_recipients').update({ email_status: 'sent' }).eq('broadcast_id', broadcast.id).in('client_id', okIds)
    if (failIds.length) await db.from('broadcast_recipients').update({ email_status: 'failed' }).eq('broadcast_id', broadcast.id).in('client_id', failIds)
  }

  await logAudit({
    admin,
    action: 'SEND_BROADCAST',
    resource: 'comunicacoes',
    targetId: broadcast.id,
    details: { subject: parsed.data.subject, audience: parsed.data.mode, recipientCount: clients.length, recipientIds: clients.map((c) => c.id), email: wantsEmail ? { sent, failed } : 'não pedido', excerpt: parsed.data.body.slice(0, 300) },
  })

  revalidatePath('/admin/comunicacoes')
  revalidatePath('/area-cliente', 'layout')

  const emailNote = wantsEmail ? ` Emails: ${sent} enviados${failed ? `, ${failed} falharam (ver detalhe)` : ''}.` : ' (sem email; visível no portal.)'
  return { status: failed && !sent ? 'error' : 'success', message: `Mensagem enviada a ${clients.length} ${clients.length === 1 ? 'cliente' : 'clientes'}.${emailNote}`, broadcastId: broadcast.id }
}

/**
 * Marca um comunicado como lido pelo cliente (feito no servidor: o cliente não escreve nesta tabela).
 * `clientId` vem sempre da sessão, nunca do que for passado à função — caso contrário qualquer
 * chamada direta a esta Server Action podia marcar como lido um comunicado de outro cliente.
 */
export async function markBroadcastRead(broadcastId: string) {
  const profile = await requireUser()
  await createAdminClient().from('broadcast_recipients').update({ read_at: new Date().toISOString() }).eq('broadcast_id', broadcastId).eq('client_id', profile.id).is('read_at', null)
}
