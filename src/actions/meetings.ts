'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { siteUrl } from '@/data/site'
import { getRecipient, sendEmail } from '@/lib/contact-delivery'
import { emailLayout, escapeHtml } from '@/lib/email-template'
import { requireAdmin } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createAdminClient } from '@/lib/supabase/server'
import { MEETING_KINDS } from '@/types/lead'

const isLive = () => isSupabaseConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

const schema = z.object({
  leadId: z.string().min(1).max(60),
  leadLabel: z.string().min(1).max(160),
  start: z.iso.datetime({ offset: true }).or(z.iso.datetime()),
  durationMin: z.coerce.number().int().min(5).max(480).default(30),
  kind: z.enum(MEETING_KINDS).default('reuniao'),
})

export type ScheduleMeetingResult = { ok: true } | { ok: false; message: string }

/**
 * Agenda uma reunião a sério (antes só existia na sessão do browser) e avisa o admin por email —
 * o lembrete que falta para não se perder nenhuma reunião marcada.
 */
export async function scheduleMeeting(input: unknown): Promise<ScheduleMeetingResult> {
  const admin = await requireAdmin()
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const { leadId, leadLabel, start, durationMin, kind } = parsed.data
  const title = `Reunião — ${leadLabel}`

  if (isLive()) {
    const { error } = await createAdminClient().from('meetings').insert({ lead_id: leadId, title, start, duration_min: durationMin, kind, created_by: admin.id })
    if (error) return { ok: false, message: 'Não foi possível agendar a reunião.' }
  }

  try {
    const to = await getRecipient()
    const when = new Date(start).toLocaleString('pt-PT', { dateStyle: 'full', timeStyle: 'short', timeZone: 'UTC' })
    await sendEmail({
      to,
      subject: `Lembrete: reunião agendada — ${leadLabel}`,
      html: emailLayout({
        title: 'Reunião agendada',
        bodyHtml: `<p style="margin:0 0 12px"><strong>${escapeHtml(leadLabel)}</strong></p>
<p style="margin:0 0 12px">${escapeHtml(when)} · ${durationMin} min</p>`,
        cta: { label: 'Ver no Pipeline', href: `${siteUrl}/admin/pipeline` },
        footer: 'Lembrete automático do Escritório Virtual BillTech.',
      }),
    })
  } catch (error) {
    console.error('[meetings] envio do lembrete por email falhou (reunião já foi guardada):', error)
  }

  revalidatePath('/admin/prospecting')
  revalidatePath('/admin/crm')
  return { ok: true }
}
