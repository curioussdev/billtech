'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { siteUrl } from '@/data/site'
import { getRecipient, sendEmail } from '@/lib/contact-delivery'
import { logAudit } from '@/lib/audit'
import { FORBIDDEN_MESSAGE, requireAdmin, requireUser, verifySuperAdminAutonomy } from '@/lib/auth'
import { emailLayout, escapeHtml } from '@/lib/email-template'
import { createAdminClient } from '@/lib/supabase/server'
import { isValidNif } from '@/lib/validations/nif'

export type ProfileChangeResult = { ok: true } | { ok: false; message: string }

/**
 * Preenche o NIF pela primeira vez — só funciona enquanto estiver vazio. Depois de preenchido,
 * só muda por pedido aprovado (`requestProfileChange` + `resolveProfileChangeRequest`), nunca por
 * edição direta: é um dado fiscal, não um campo de conveniência.
 */
export async function setNif(nif: string): Promise<ProfileChangeResult> {
  const user = await requireUser()
  const cleaned = nif.replace(/\D/g, '')
  if (!isValidNif(cleaned)) return { ok: false, message: 'NIF inválido — verifique os 9 dígitos.' }

  const db = createAdminClient()
  const { data, error } = await db.from('profiles').update({ nif: cleaned }).eq('id', user.id).is('nif', null).select('id')
  if (error) return { ok: false, message: 'Não foi possível guardar o NIF.' }
  if (!data || data.length === 0) return { ok: false, message: 'O NIF já está definido — para o alterar, solicite a alteração.' }

  await logAudit({ admin: user, action: 'SET_NIF', resource: 'clientes', targetId: user.id, details: { nif: cleaned } })
  revalidatePath('/area-cliente/conta')
  return { ok: true }
}

const requestSchema = z.object({
  field: z.enum(['nif', 'email']),
  requestedValue: z.string().trim().min(1, 'Indique o novo valor.').max(254),
  reason: z.string().trim().max(500).optional(),
})

/**
 * Pede a alteração de um campo sensível (NIF ou email) já preenchido — nunca aplica a alteração
 * diretamente; cria um pedido pendente que um admin tem de aprovar.
 */
export async function requestProfileChange(input: unknown): Promise<ProfileChangeResult> {
  const user = await requireUser()
  const parsed = requestSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  const { field, reason } = parsed.data
  const requestedValue = field === 'nif' ? parsed.data.requestedValue.replace(/\D/g, '') : parsed.data.requestedValue.trim().toLowerCase()

  if (field === 'nif' && !isValidNif(requestedValue)) return { ok: false, message: 'NIF inválido — verifique os 9 dígitos.' }
  if (field === 'email' && !z.email().safeParse(requestedValue).success) return { ok: false, message: 'Indique um email válido.' }

  const db = createAdminClient()
  const currentValue = field === 'nif' ? (user.nif ?? '') : user.email
  const { error } = await db.from('profile_change_requests').insert({
    client_id: user.id,
    field,
    current_value: currentValue,
    requested_value: requestedValue,
    reason: reason ?? '',
  })
  if (error) return { ok: false, message: 'Não foi possível registar o pedido.' }

  try {
    const to = await getRecipient()
    await sendEmail({
      to,
      subject: `Pedido de alteração de ${field === 'nif' ? 'NIF' : 'email'} — ${user.full_name || user.email}`,
      html: emailLayout({
        title: 'Novo pedido de alteração',
        bodyHtml: `<p style="margin:0 0 12px"><strong>${escapeHtml(user.full_name || user.email)}</strong> (${escapeHtml(user.email)}) pediu para alterar o ${field === 'nif' ? 'NIF' : 'email'}.</p>
<p style="margin:0 0 12px">De: <code>${escapeHtml(currentValue || '—')}</code> → Para: <code>${escapeHtml(requestedValue)}</code></p>
${reason ? `<p style="margin:0 0 12px">Motivo: ${escapeHtml(reason)}</p>` : ''}`,
        cta: { label: 'Rever na ficha do cliente', href: `${siteUrl}/admin/clientes/${user.id}` },
        footer: 'Pedido de alteração de dados sensíveis — requer aprovação manual.',
      }),
    })
  } catch (emailError) {
    console.error('[profile-changes] notificação ao admin falhou (pedido já foi registado):', emailError)
  }

  revalidatePath('/area-cliente/conta')
  return { ok: true }
}

const resolveSchema = z.object({
  requestId: z.uuid(),
  approve: z.boolean(),
  note: z.string().trim().max(500).optional(),
})

/**
 * Admin aprova (aplica a alteração) ou rejeita um pedido pendente de NIF/email. Aprovar uma
 * alteração de email muda a identidade de login do cliente — exige Super Admin, não só Admin; NIF
 * (dado fiscal, sem impacto no acesso) só exige Admin.
 *
 * A verificação de autorização corre sempre primeiro — antes de qualquer leitura à base de dados,
 * mesmo que o nível exato exigido (Admin vs. Super Admin) só se saiba depois de ler `request.field`.
 */
export async function resolveProfileChangeRequest(input: unknown): Promise<ProfileChangeResult> {
  const parsed = resolveSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' }
  const { requestId, approve, note } = parsed.data

  const admin = await requireAdmin()
  const db = createAdminClient()
  const { data: request, error: fetchError } = await db.from('profile_change_requests').select('*').eq('id', requestId).eq('status', 'pendente').maybeSingle()
  if (fetchError || !request) return { ok: false, message: 'Pedido não encontrado ou já resolvido.' }

  if (request.field === 'email' && !verifySuperAdminAutonomy(admin)) {
    await logAudit({ admin, action: 'ACCESS_DENIED', resource: 'seguranca', details: { attempted: { action: 'RESOLVE_PROFILE_CHANGE', resource: 'clientes' } } })
    return { ok: false, message: FORBIDDEN_MESSAGE }
  }

  if (approve) {
    if (request.field === 'nif') {
      const { error } = await db.from('profiles').update({ nif: request.requested_value }).eq('id', request.client_id)
      if (error) return { ok: false, message: 'Não foi possível aplicar a alteração.' }
    } else {
      const { error: authError } = await db.auth.admin.updateUserById(request.client_id, { email: request.requested_value, email_confirm: true })
      if (authError) return { ok: false, message: `Não foi possível alterar o email: ${authError.message}` }
      await db.from('profiles').update({ email: request.requested_value }).eq('id', request.client_id)
    }
  }

  await db
    .from('profile_change_requests')
    .update({ status: approve ? 'aprovado' : 'rejeitado', resolved_at: new Date().toISOString(), resolved_by: admin.id, resolution_note: note ?? '' })
    .eq('id', requestId)

  await logAudit({
    admin,
    action: 'RESOLVE_PROFILE_CHANGE',
    resource: 'clientes',
    targetId: request.client_id,
    details: { field: request.field, from: request.current_value, to: request.requested_value, approved: approve, note },
  })
  revalidatePath(`/admin/clientes/${request.client_id}`)
  revalidatePath('/area-cliente/conta')
  return { ok: true }
}
