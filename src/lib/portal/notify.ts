import 'server-only'
import { siteUrl } from '@/data/site'
import { getRecipient, sendEmail } from '@/lib/contact-delivery'
import { emailLayout, escapeHtml } from '@/lib/email-template'
import { priorityLabels, requestStatusLabels, requestTypeLabels } from '@/lib/portal/labels'
import type { PortalRequest, RequestStatus } from '@/types/portal'

/** Adaptador: mantém a assinatura antiga (título, corpo, CTA) sobre o layout partilhado. */
const layout = (title: string, bodyHtml: string, cta: { label: string; href: string }) => emailLayout({ title, bodyHtml, cta })

const quote = (text: string) => `<blockquote style="margin:12px 0;padding:10px 14px;border-left:3px solid #0f6a70;background:#f6f8fa;white-space:pre-wrap">${escapeHtml(text)}</blockquote>`
const meta = (r: PortalRequest) => `<p style="margin:0 0 8px;color:#4b5563;font-size:14px">${escapeHtml(requestTypeLabels[r.type])} · Prioridade ${escapeHtml(priorityLabels[r.priority])}</p>`

// Nenhuma notificação pode impedir a ação principal: falhas só ficam em log.
async function safely(label: string, task: () => Promise<void>) {
  try {
    await task()
  } catch (error) {
    console.error(`[notify] ${label}:`, error)
  }
}

export const clientRequestUrl = (id: string) => `${siteUrl}/area-cliente/pedidos/${id}`
export const adminRequestUrl = (id: string) => `${siteUrl}/admin/pedidos/${id}`

export function notifyAdminNewRequest(request: PortalRequest, clientName: string, clientEmail: string) {
  return safely('novo pedido', async () => {
    await sendEmail({
      to: await getRecipient(),
      replyTo: clientEmail,
      subject: `[Novo pedido] ${request.title} — ${clientName}`,
      html: layout(`Novo pedido de ${clientName}`, `${meta(request)}<p style="margin:0"><strong>${escapeHtml(request.title)}</strong></p>${quote(request.description)}`, { label: 'Abrir no painel', href: adminRequestUrl(request.id) }),
    })
  })
}

export function notifyAdminClientReply(request: PortalRequest, clientName: string, clientEmail: string, body: string) {
  return safely('resposta do cliente', async () => {
    await sendEmail({
      to: await getRecipient(),
      replyTo: clientEmail,
      subject: `[Resposta] ${request.title} — ${clientName}`,
      html: layout(`${clientName} respondeu`, `<p style="margin:0 0 8px;color:#4b5563;font-size:14px">${escapeHtml(request.title)}</p>${quote(body)}`, { label: 'Responder no painel', href: adminRequestUrl(request.id) }),
    })
  })
}

export function notifyClientReply(request: PortalRequest, clientEmail: string, clientName: string, body: string) {
  return safely('resposta ao cliente', async () => {
    await sendEmail({
      to: clientEmail,
      subject: `Nova mensagem no seu pedido: ${request.title}`,
      html: layout(`Olá ${clientName || ''}, a BillTech respondeu`.replace('Olá , ', 'Olá, '), `<p style="margin:0 0 8px;color:#4b5563;font-size:14px">${escapeHtml(request.title)}</p>${quote(body)}`, { label: 'Ver e responder', href: clientRequestUrl(request.id) }),
    })
  })
}

export function notifyClientStatus(request: PortalRequest, clientEmail: string, status: RequestStatus) {
  return safely('estado do pedido', async () => {
    await sendEmail({
      to: clientEmail,
      subject: `O seu pedido "${request.title}" está: ${requestStatusLabels[status]}`,
      html: layout('O estado do seu pedido mudou', `<p style="margin:0 0 8px">${escapeHtml(request.title)}</p><p style="margin:0;font-size:16px"><strong>${escapeHtml(requestStatusLabels[status])}</strong></p>`, { label: 'Ver pedido', href: clientRequestUrl(request.id) }),
    })
  })
}
