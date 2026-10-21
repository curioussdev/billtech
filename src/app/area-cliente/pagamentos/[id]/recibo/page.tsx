import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { PrintButton } from '@/components/portal/print-button'
import { formatDate, formatEUR } from '@/lib/finance/labels'
import { getMyInvoice } from '@/lib/finance/queries'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Recibo' }

/**
 * Recibo simples, pronto a imprimir/guardar em PDF pelo próprio navegador (Ctrl/Cmd+P) — sem
 * depender de uma biblioteca de geração de PDF no servidor (que este projeto, de propósito, ainda
 * não tem — ver `src/app/api/admin/reports/pdf/route.ts`). Entrega o mesmo resultado ao cliente sem
 * essa dependência extra.
 */
export default async function PortalInvoiceReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()

  const profile = await requireUser()
  const invoice = await getMyInvoice(id)
  if (!invoice) notFound()
  const payments = invoice.payments.filter((p) => p.status === 'sucesso').sort((a, b) => (a.paidAt ?? '').localeCompare(b.paidAt ?? ''))
  if (payments.length === 0) notFound() // sem pagamento confirmado, não há recibo a emitir
  const total = payments.reduce((sum, p) => sum + p.amount, 0)
  const latest = payments[payments.length - 1]

  return (
    <div className="mx-auto grid max-w-xl gap-6 print:max-w-none">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-black tracking-tight">Recibo</h1>
        <PrintButton />
      </div>

      <div className="grid gap-6 rounded-2xl border border-border bg-card p-8 print:rounded-none print:border-0 print:p-0">
        <div className="flex items-start justify-between border-b border-border pb-6">
          <div>
            <p className="text-xl font-black tracking-tight">BillTech</p>
            <p className="text-sm text-muted-foreground">Recibo de pagamento</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Nº {latest.id.slice(0, 8).toUpperCase()}</p>
            <p>{latest.paidAt ? formatDate(latest.paidAt) : '—'}</p>
          </div>
        </div>

        <div className="grid gap-1 text-sm">
          <p className="text-muted-foreground">Pago por</p>
          <p className="font-semibold">{profile.full_name || profile.email}</p>
          {profile.company && <p className="text-muted-foreground">{profile.company}</p>}
        </div>

        <div className="grid gap-2 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">{invoice.description}</p>
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{p.paidAt ? formatDate(p.paidAt) : '—'} · {p.paymentMethod || 'Stripe'}</span>
              <span className="tabular-nums">{formatEUR(p.amount)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-6 text-lg font-black">
          <span>Total pago</span>
          <span className="tabular-nums">{formatEUR(total)}</span>
        </div>

        <p className="text-xs text-muted-foreground">Este documento serve como comprovativo de pagamento, não substitui fatura-recibo fiscal quando aplicável.</p>
      </div>
    </div>
  )
}
