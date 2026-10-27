import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CalendarClock, CheckCircle2, Clock, CreditCard, XCircle } from 'lucide-react'
import { RevokeAutopayButton, SetupAutopayButton } from '@/components/portal/autopay-widgets'
import { PaymentStatusBadge } from '@/components/portal/invoice-widgets'
import { formatDate, formatEUR } from '@/lib/finance/labels'
import { getMyAutopayMandate, getMyInvoices } from '@/lib/finance/queries'
import type { Installment, Payment } from '@/types/finance'

export const metadata: Metadata = { title: 'Débito automático' }

type DueItem = { invoiceId: string; description: string; amount: number; dueDate: string }

export default async function AutopayMethodPage({ searchParams }: { searchParams: Promise<{ ativado?: string; cancelado?: string }> }) {
  const [{ ativado, cancelado }, display, invoices] = await Promise.all([searchParams, getMyAutopayMandate(), getMyInvoices()])
  const autopayInvoices = invoices.filter((i) => i.autopayEnabled && i.status !== 'pago' && i.status !== 'cancelado')

  // Próxima parcela/fatura a ser cobrada automaticamente — a vencer mais cedo entre as faturas com autopay ativo.
  const dueItems: DueItem[] = autopayInvoices.flatMap((inv): DueItem[] =>
    inv.paymentType === 'parcelado'
      ? inv.installments.filter((i: Installment) => i.status !== 'pago').map((i) => ({ invoiceId: inv.id, description: inv.description, amount: i.amount, dueDate: i.dueDate }))
      : [{ invoiceId: inv.id, description: inv.description, amount: inv.finalAmount, dueDate: inv.dueDate }],
  )
  const nextDue = [...dueItems].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null

  // Histórico de tentativas de débito automático (sucesso, a processar ou falhadas) — últimas 5.
  const invoiceDescById = new Map(invoices.map((i) => [i.id, i.description]))
  const autopayAttempts: (Payment & { invoiceDescription: string })[] = invoices
    .flatMap((i) => i.payments)
    .filter((p) => p.paymentMethod === 'autopay')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map((p) => ({ ...p, invoiceDescription: invoiceDescById.get(p.invoiceId) ?? '' }))

  return (
    <div className="mx-auto grid max-w-xl gap-6">
      <Link href="/area-cliente/pagamentos" className="inline-flex w-fit items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Pagamentos e Faturas
      </Link>

      <header>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Débito automático</h1>
        <p className="mt-2 text-muted-foreground">Guarde um cartão ou o IBAN da sua conta e deixe as parcelas que escolher cobrarem-se sozinhas, sem ter de voltar aqui a cada vencimento. É sempre opcional — pode continuar a pagar manualmente ou por transferência quando preferir.</p>
      </header>

      {ativado && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>A confirmar a configuração — assim que a Stripe terminar, o método fica ativo aqui.</span>
        </p>
      )}
      {cancelado && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
          <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>Configuração cancelada. Pode tentar novamente quando quiser.</span>
        </p>
      )}

      <section aria-label="Método guardado" className="grid gap-3 rounded-2xl border border-border bg-card p-6">
        {display ? (
          <>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="size-4 text-primary" aria-hidden />
              {display.label}
            </p>
            <p className="text-sm text-muted-foreground">Débito direto por SEPA pode demorar alguns dias a confirmar — nunca cobramos mais do que o indicado em cada fatura, e nunca é adicionado IVA automaticamente a nada.</p>
            <RevokeAutopayButton />
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Ainda não tem nenhum método guardado.</p>
            <SetupAutopayButton />
          </>
        )}
      </section>

      {display && nextDue && (
        <section aria-label="Próxima cobrança" className="grid gap-1 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <CalendarClock className="size-3.5" aria-hidden /> Próxima cobrança automática
          </p>
          <p className="text-2xl font-black tabular-nums">{formatEUR(nextDue.amount)}</p>
          <p className="text-sm text-muted-foreground">
            {nextDue.description} · {formatDate(nextDue.dueDate)}
          </p>
        </section>
      )}

      {display && (
        <section aria-labelledby="faturas-autopay" className="grid gap-3">
          <h2 id="faturas-autopay" className="text-lg font-bold">
            Faturas com cobrança automática
          </h2>
          {autopayInvoices.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
              Nenhuma fatura está a ser cobrada automaticamente. Ative a opção dentro de cada fatura em aberto.
            </p>
          ) : (
            <ul className="grid gap-2">
              {autopayInvoices.map((invoice) => (
                <li key={invoice.id}>
                  <Link href={`/area-cliente/pagamentos/${invoice.id}`} className="block rounded-xl border border-border bg-card p-4 text-sm hover:bg-muted/60">
                    <span className="font-medium">{invoice.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {display && autopayAttempts.length > 0 && (
        <section aria-labelledby="historico-autopay" className="grid gap-3">
          <h2 id="historico-autopay" className="flex items-center gap-1.5 text-lg font-bold">
            <Clock className="size-4 text-muted-foreground" aria-hidden /> Últimas cobranças automáticas
          </h2>
          <ul className="grid gap-2">
            {autopayAttempts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.invoiceDescription}</span>
                  <span className="block text-xs text-muted-foreground">{formatDate(p.paidAt ?? p.createdAt)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold tabular-nums">{formatEUR(p.amount)}</span>
                  <PaymentStatusBadge status={p.status} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
