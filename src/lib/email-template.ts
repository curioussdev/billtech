export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

/** Layout de email sóbrio e compatível com clientes de email (tabelas + estilos inline). */
export function emailLayout({
  title,
  bodyHtml,
  cta,
  footer = 'Recebe este email porque tem um pedido ativo na BillTech.',
}: {
  title: string
  bodyHtml: string
  cta?: { label: string; href: string }
  footer?: string
}) {
  const button = cta
    ? `<p style="margin:24px 0 0"><a href="${cta.href}" style="display:inline-block;background:#0f6a70;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">${escapeHtml(cta.label)}</a></p>`
    : ''

  return `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#18202b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#0f6a70;color:#ffffff;padding:18px 24px;font-size:18px;font-weight:bold">BillTech</td></tr>
<tr><td style="padding:24px;line-height:1.55">
<h2 style="margin:0 0 12px;font-size:20px">${escapeHtml(title)}</h2>
${bodyHtml}
${button}
</td></tr>
<tr><td style="padding:16px 24px;font-size:12px;color:#6b7280;border-top:1px solid #eef0f3">${escapeHtml(footer)}</td></tr>
</table></td></tr></table></body></html>`
}
