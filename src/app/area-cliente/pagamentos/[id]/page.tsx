import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { ArrowLeft, CalendarClock, CheckCircle2, Receipt, XCircle } from 'lucide-react'
import { InstallmentTable, InvoiceStatusBadge } from '@/components/portal/invoice-widgets'
import { InstallmentPlanButton, PayButton } from '@/components/portal/payment-modals'
import { Button } from '@/components/ui/button'
import { formatDate, formatEUR, paymentTypeLabels } from '@/lib/finance/labels'
import { getMyInvoice } from '@/lib/finance/queries'

export const metadata: Metadata = { title: 'Fatura' }

export default async function PortalInvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ pago?: string; cancelado?: string }> }) {
  const [{ id }, { pago, cancelado }] = await Promise.all([params, searchParams])
  if (!z.uuid().safeParse(id).success) notFound()

  const invoice = await getMyInvoice(id)
  if (!invoice) notFound()

  const canPay = invoice.status === 'pendente' || invoice.status === 'atrasado'
  const successfulPayment = invoice.payments.find((p) => p.status === 'sucesso')

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <Link href="/area-cliente/pagamentos" className="inline-flex w-fit items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Faturas
      </Link>

      {pago && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <strong>A confirmar o pagamento.</strong> Assim que a Stripe confirmar, o estado desta fatura atualiza-se automaticamente — pode demorar alguns minutos (mais tempo no caso do Multibanco).
          </span>
        </p>
      )}
      {cancelado && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
          <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>Pagamento cancelado. A fatura continua disponível — pode tentar novamente quando quiser.</span>
        </p>
      )}

      <header className="grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">{invoice.description}</h1>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="size-4" aria-hidden />
          Vencimento: {formatDate(invoice.dueDate)} · {paymentTypeLabels[invoice.paymentType]}
        </p>
      </header>

      <section aria-label="Valores" className="grid gap-2 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Valor</span>
          <span className="tabular-nums">{formatEUR(invoice.totalAmount)}</span>
        </div>
        {invoice.discountAmount > 0 && (
          <div className="flex items-center justify-between text-sm text-emerald-700 dark:text-emerald-400">
            <span>Desconto</span>
            <span className="tabular-nums">− {formatEUR(invoice.discountAmount)}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-lg font-black">
          <span>Total</span>
          <span className="tabular-nums">{formatEUR(invoice.finalAmount)}</span>
        </div>
      </section>

      {invoice.paymentType === 'parcelado' && (
        <section aria-labelledby="parcelas" className="grid gap-3">
          <h2 id="parcelas" className="text-lg font-bold">
            Parcelas
          </h2>
          <InstallmentTable installments={invoice.installments} invoice={invoice} />
        </section>
      )}

      {canPay && (
        <section aria-label="Pagar" className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          {invoice.paymentType === 'unico' ? (
            <>
              <PayButton invoice={invoice} />
              <InstallmentPlanButton invoice={invoice} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Pague cada parcela à medida que for vencendo, na lista acima.</p>
          )}
        </section>
      )}

      {successfulPayment && (
        <Button render={<Link href={`/area-cliente/pagamentos/${invoice.id}/recibo`} />} nativeButton={false} variant="outline" className="w-fit rounded-full">
          <Receipt aria-hidden /> Descarregar recibo
        </Button>
      )}
    </div>
  )
}
