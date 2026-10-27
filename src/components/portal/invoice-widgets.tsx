import Link from 'next/link'
import { CalendarClock } from 'lucide-react'
import { PayButton } from '@/components/portal/payment-modals'
import { PaymentProgressBar } from '@/components/portal/payment-progress'
import { formatDate, formatEUR, installmentStatusLabels, invoiceStatusLabels, paymentStatusLabels } from '@/lib/finance/labels'
import { paymentProgress } from '@/lib/finance/progress'
import { cn } from '@/lib/utils'
import type { Installment, InstallmentStatus, InvoiceStatus, InvoiceWithDetails, PaymentStatus } from '@/types/finance'

const pill = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold'

const invoiceStatusStyles: Record<InvoiceStatus, string> = {
  pendente: 'bg-sky-500/15 text-sky-800 dark:text-sky-300',
  pago: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  atrasado: 'bg-red-500/15 text-red-800 dark:text-red-300',
  cancelado: 'bg-muted text-muted-foreground',
}

export function InvoiceStatusBadge({ status, className }: { status: InvoiceStatus; className?: string }) {
  return <span className={cn(pill, invoiceStatusStyles[status], className)}>{invoiceStatusLabels[status]}</span>
}

const installmentStatusStyles: Record<InstallmentStatus, string> = {
  pendente: 'bg-sky-500/15 text-sky-800 dark:text-sky-300',
  pago: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  atrasado: 'bg-red-500/15 text-red-800 dark:text-red-300',
}

export function InstallmentStatusBadge({ status, className }: { status: InstallmentStatus; className?: string }) {
  return <span className={cn(pill, installmentStatusStyles[status], className)}>{installmentStatusLabels[status]}</span>
}

const paymentStatusStyles: Record<PaymentStatus, string> = {
  pendente: 'bg-sky-500/15 text-sky-800 dark:text-sky-300',
  sucesso: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  falhou: 'bg-red-500/15 text-red-800 dark:text-red-300',
  reembolsado: 'bg-muted text-muted-foreground',
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return <span className={cn(pill, paymentStatusStyles[status], className)}>{paymentStatusLabels[status]}</span>
}

/** Linha de fatura numa lista (dashboard ou página de pagamentos) — liga sempre ao detalhe. */
export function InvoiceListItem({ invoice }: { invoice: InvoiceWithDetails }) {
  const progress = paymentProgress(invoice)
  const showProgress = invoice.status !== 'cancelado' && (progress.paidAmount > 0 || invoice.paymentType === 'parcelado')

  return (
    <Link href={`/area-cliente/pagamentos/${invoice.id}`} className="grid gap-2 p-4 transition-colors hover:bg-muted/60">
      <span className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0">
          <span className="block truncate font-medium leading-snug">{invoice.description}</span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <InvoiceStatusBadge status={invoice.status} />
            {invoice.paymentType === 'parcelado' && <span>Parcelado em {invoice.installments.length}x</span>}
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3.5" aria-hidden />
              Vencimento {formatDate(invoice.dueDate)}
            </span>
          </span>
        </span>
        <span className="shrink-0 text-right">
          {invoice.discountAmount > 0 && <span className="block text-xs text-muted-foreground line-through">{formatEUR(invoice.totalAmount)}</span>}
          <span className="block text-lg font-black tabular-nums">{formatEUR(invoice.finalAmount)}</span>
        </span>
      </span>
      {showProgress && <PaymentProgressBar progress={progress} compact />}
    </Link>
  )
}

/** `invoice` opcional: quando presente e a fatura ainda aceitar pagamento, cada parcela pendente/atrasada ganha um botão "Pagar". */
export function InstallmentTable({ installments, invoice }: { installments: Installment[]; invoice?: InvoiceWithDetails }) {
  if (installments.length === 0) return null
  const payable = invoice && invoice.status !== 'pago' && invoice.status !== 'cancelado'
  return (
    <ul className="grid gap-2">
      {installments.map((i) => (
        <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm">
          <span className="font-medium">
            Parcela {i.installmentNumber}/{installments.length}
          </span>
          <span className="text-muted-foreground">Vence {formatDate(i.dueDate)}</span>
          <span className="tabular-nums font-semibold">{formatEUR(i.amount)}</span>
          {payable && i.status !== 'pago' ? <PayButton invoice={invoice} installment={i} variant="outline" /> : <InstallmentStatusBadge status={i.status} />}
        </li>
      ))}
    </ul>
  )
}
