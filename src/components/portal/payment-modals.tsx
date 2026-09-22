'use client'

import { useState } from 'react'
import { CreditCard, Layers, Loader2 } from 'lucide-react'
import { createCheckoutSession, requestInstallmentPlan } from '@/actions/payments'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { buildInstallmentRows } from '@/lib/finance/installments'
import { formatDate, formatEUR } from '@/lib/finance/labels'
import type { Installment, InvoiceWithDetails } from '@/types/finance'

/**
 * Botão + modal de pagamento — serve tanto para "Pagar Totalidade" (sem `installment`) como para
 * pagar uma parcela específica (com `installment`). Redireciona para o checkout alojado da Stripe;
 * sem chaves configuradas, mostra um aviso empático em vez de fingir que algo foi cobrado.
 */
export function PayButton({ invoice, installment, variant = 'default' }: { invoice: InvoiceWithDetails; installment?: Installment; variant?: 'default' | 'outline' }) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mock, setMock] = useState(false)

  const amount = installment ? installment.amount : invoice.finalAmount
  const label = installment ? `Pagar parcela ${installment.installmentNumber}` : `Pagar Totalidade (${formatEUR(amount)})`

  async function confirm() {
    setPending(true)
    setError(null)
    const result = await createCheckoutSession({ invoiceId: invoice.id, installmentId: installment?.id ?? '', idempotencyKey: crypto.randomUUID() })
    setPending(false)
    if (!result.ok) return setError(result.message)
    if (result.mock) return setMock(true)
    if (result.url) window.location.href = result.url
  }

  return (
    <>
      <Button type="button" size="sm" variant={variant} onClick={() => setOpen(true)} className="rounded-full">
        <CreditCard aria-hidden /> {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar {formatEUR(amount)}</DialogTitle>
            <DialogDescription>{invoice.description}</DialogDescription>
          </DialogHeader>

          {mock ? (
            <p role="status" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm leading-6 text-amber-900 dark:text-amber-200">
              Os pagamentos online ainda não estão disponíveis. Contacte a nossa equipa para combinarmos o pagamento — a sua fatura continua disponível e nada foi cobrado.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Vai ser encaminhado para uma página segura da Stripe, onde pode pagar por cartão, MB WAY ou referência Multibanco.</p>
              {error && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  O pagamento não foi processado. {error} A sua fatura continua disponível.
                </p>
              )}
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {mock ? 'Fechar' : 'Cancelar'}
            </Button>
            {!mock && (
              <Button type="button" onClick={confirm} disabled={pending} className="rounded-xl">
                {pending ? <Loader2 className="animate-spin" aria-hidden /> : <CreditCard aria-hidden />} Confirmar pagamento
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** "Parcelar em 3x sem juros" — self-service, sempre 3 parcelas (a oferta já decidida pelo negócio). */
export function InstallmentPlanButton({ invoice }: { invoice: InvoiceWithDetails }) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const preview = buildInstallmentRows(invoice.finalAmount, 3, invoice.dueDate)

  async function confirm() {
    setPending(true)
    setError(null)
    const result = await requestInstallmentPlan({ invoiceId: invoice.id })
    setPending(false)
    if (!result.ok) return setError(result.message)
    setDone(true)
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="rounded-full"
      >
        <Layers aria-hidden /> Parcelar em 3x sem juros
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setDone(false)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parcelar em 3x sem juros</DialogTitle>
            <DialogDescription>{invoice.description}</DialogDescription>
          </DialogHeader>

          {done ? (
            <p role="status" className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-900 dark:text-emerald-200">
              Parcelamento confirmado. Pode pagar cada parcela à medida que for vencendo, aqui na página desta fatura.
            </p>
          ) : (
            <>
              <ul className="grid gap-2">
                {preview.map((p) => (
                  <li key={p.installment_number} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm">
                    <span className="font-medium">Parcela {p.installment_number}/3</span>
                    <span className="text-muted-foreground">Vence {formatDate(p.due_date)}</span>
                    <span className="tabular-nums font-semibold">{formatEUR(p.amount)}</span>
                  </li>
                ))}
              </ul>
              {error && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {error}
                </p>
              )}
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {done ? 'Fechar' : 'Cancelar'}
            </Button>
            {!done && (
              <Button type="button" onClick={confirm} disabled={pending} className="rounded-xl">
                {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Layers aria-hidden />} Confirmar Parcelamento
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
