import 'server-only'
import { DEFAULT_CONTACT_EMAIL, siteUrl } from '@/data/site'
import { emailLayout, escapeHtml } from '@/lib/email-template'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createAdminClient } from '@/lib/supabase/server'
import type { ContactInput } from '@/lib/validations/contact'

type Lead = ContactInput & { userId?: string }

export { escapeHtml }

export const hasServiceRole = () => isSupabaseConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function getRecipient(): Promise<string> {
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

export type OutgoingEmail = { to: string; subject: string; html: string; replyTo?: string }

/** Envio genérico via Resend. Lança erro se falhar — quem chama decide se é fatal. */
export async function sendEmail({ to, subject, html, replyTo }: OutgoingEmail) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY não definida')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.RESEND_FROM || 'BillTech <onboarding@resend.dev>', to: [to], reply_to: replyTo, subject, html }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Resend respondeu ${response.status}: ${await response.text()}`)
}

/**
 * Envio em lote (Resend aceita até 100 por chamada). Devolve, por email e pela mesma ordem, se foi aceite.
 * Uma chamada falhada marca só esse bloco como falhado; os restantes seguem.
 */
export async function sendEmailBatch(emails: OutgoingEmail[]): Promise<boolean[]> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return emails.map(() => false)

  const results: boolean[] = []
  const CHUNK = 50
  for (let i = 0; i < emails.length; i += CHUNK) {
    const chunk = emails.slice(i, i + CHUNK)
    try {
      const response = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk.map((e) => ({ from: process.env.RESEND_FROM || 'BillTech <onboarding@resend.dev>', to: [e.to], reply_to: e.replyTo, subject: e.subject, html: e.html }))),
        signal: AbortSignal.timeout(20_000),
      })
      if (!response.ok) throw new Error(`Resend respondeu ${response.status}: ${await response.text()}`)
      results.push(...chunk.map(() => true))
    } catch (error) {
      console.error('[broadcast] lote de emails falhou:', error)
      results.push(...chunk.map(() => false))
    }
  }
  return results
}

async function sendLeadEmail(lead: Lead, to: string) {
  const rows = [
    ['Nome', lead.name],
    ['Email', lead.email],
    ['WhatsApp', lead.whatsapp || '—'],
    ['Origem', lead.userId ? 'Área de cliente' : 'Formulário público'],
  ]
  const html = `<h2>Novo contacto através do site</h2>
<table cellpadding="6">${rows.map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${escapeHtml(v)}</td></tr>`).join('')}</table>
<h3>Mensagem</h3><p style="white-space:pre-wrap">${escapeHtml(lead.challenge)}</p>`
  await sendEmail({ to, subject: `Novo contacto BillTech — ${lead.name}`, html, replyTo: lead.email })
}

/**
 * Confirmação de receção enviada a quem preencheu o formulário público.
 * Não inclui o texto da mensagem (evita que o formulário sirva para enviar conteúdo arbitrário a terceiros)
 * e limita-se a 2 confirmações por hora por endereço.
 */
async function sendConfirmationToSender(lead: Lead, replyTo: string) {
  if (hasServiceRole()) {
    const { count } = await createAdminClient()
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('email', lead.email)
      .gte('created_at', new Date(Date.now() - 3_600_000).toISOString())
    if ((count ?? 0) > 2) return
  }

  const firstName = lead.name.trim().split(/s+/)[0]
  await sendEmail({
    to: lead.email,
    replyTo,
    subject: 'Recebemos a sua mensagem — BillTech',
    html: emailLayout({
      title: `Olá ${firstName}, recebemos a sua mensagem`,
      bodyHtml: `<p style="margin:0 0 12px">Obrigado por contactar a BillTech. A sua mensagem chegou à nossa equipa e vamos analisá-la com atenção.</p>
<p style="margin:0 0 12px"><strong>Responderemos em breve</strong>, normalmente no prazo de 1 dia útil. Se for urgente, pode responder diretamente a este email.</p>
<p style="margin:0;color:#4b5563">Até já,<br />Equipa BillTech</p>`,
      cta: { label: 'Visitar o site', href: siteUrl },
      footer: 'Recebeu este email porque enviou uma mensagem através do formulário de contacto em billtech.online. Se não foi você, ignore esta mensagem.',
    }),
  })
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
    const recipient = await getRecipient()
    await sendLeadEmail(lead, recipient)
    emailed = true

    // Só o formulário público confirma ao remetente; falhar aqui nunca invalida o envio
    if (!lead.userId) {
      await sendConfirmationToSender(lead, recipient).catch((error) => console.error('[contact] Falha na confirmação ao remetente:', error))
    }
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
