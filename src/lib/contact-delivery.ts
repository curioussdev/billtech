import 'server-only'
import { DEFAULT_CONTACT_EMAIL } from '@/data/site'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createAdminClient } from '@/lib/supabase/server'
import type { ContactInput } from '@/lib/validations/contact'

type Lead = ContactInput & { userId?: string }

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

const hasServiceRole = () => isSupabaseConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

async function getRecipient(): Promise<string> {
  if (hasServiceRole()) {
    try {
      const { data } = await createAdminClient().from('private_settings').select('value').eq('key', 'contact_email').maybeSingle()
      if (typeof data?.value === 'string' && data.value.includes('@')) return data.value
    } catch (error) {
      console.error('[contact] Falha a ler email de receção:', error)
    }
  }
  return process.env.CONTACT_TO_EMAIL || DEFAULT_CONTACT_EMAIL
}

async function sendEmail(lead: Lead, to: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY não definida')

  const rows = [
    ['Nome', lead.name],
    ['Email', lead.email],
    ['WhatsApp', lead.whatsapp || '—'],
    ['Origem', lead.userId ? 'Área de cliente' : 'Formulário público'],
  ]
  const html = `<h2>Novo contacto através do site</h2>
<table cellpadding="6">${rows.map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${escapeHtml(v)}</td></tr>`).join('')}</table>
<h3>Mensagem</h3><p style="white-space:pre-wrap">${escapeHtml(lead.challenge)}</p>`

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'BillTech <onboarding@resend.dev>',
      to: [to],
      reply_to: lead.email,
      subject: `Novo contacto BillTech — ${lead.name}`,
      html,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Resend respondeu ${response.status}: ${await response.text()}`)
}

/**
 * Ponto único de saída dos leads: guarda na base de dados (para nunca se perder)
 * e envia email. Só falha se NENHUM dos dois funcionar.
 */
export async function deliverLead(lead: Lead): Promise<void> {
  let messageId: string | undefined
  let saved = false
  let emailed = false

  if (hasServiceRole()) {
    try {
      const { data, error } = await createAdminClient()
        .from('contact_messages')
        .insert({ user_id: lead.userId ?? null, name: lead.name, email: lead.email, whatsapp: lead.whatsapp, challenge: lead.challenge })
        .select('id')
        .single()
      if (error) throw error
      messageId = data.id
      saved = true
    } catch (error) {
      console.error('[contact] Falha a guardar mensagem:', error)
    }
  }

  try {
    await sendEmail(lead, await getRecipient())
    emailed = true
  } catch (error) {
    console.error('[contact] Falha a enviar email:', error)
  }

  if (saved && emailed && messageId) {
    await createAdminClient().from('contact_messages').update({ email_sent: true }).eq('id', messageId)
  }

  if (!saved && !emailed) {
    throw new Error('Lead não entregue: configure RESEND_API_KEY e/ou SUPABASE_SERVICE_ROLE_KEY (ver .env.example)')
  }
}
