'use client'

import { useState } from 'react'
import { CreditCard, Layers, Loader2 } from 'lucide-react'
import { createCheckoutSession, requestInstallmentPlan } from '@/actions/payments'
import { InstallmentSimulator } from '@/components/shared/installment-simulator'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatEUR } from '@/lib/finance/labels'
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

/** Simulador de prestações — o cliente escolhe o nº de meses (2–12), vê o valor por prestação ao vivo, e pode ligar logo o débito automático se já tiver um método guardado. */
export function InstallmentPlanButton({ invoice, hasAutopayMandate = false }: { invoice: InvoiceWithDetails; hasAutopayMandate?: boolean }) {
  const [open, setOpen] = useState(false)
  const [months, setMonths] = useState(3)
  const [enableAutopay, setEnableAutopay] = useState(hasAutopayMandate)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function confirm() {
    setPending(true)
    setError(null)
    const result = await requestInstallmentPlan({ invoiceId: invoice.id, numberOfInstallments: months, enableAutopay: hasAutopayMandate && enableAutopay })
    setPending(false)
    if (!result.ok) return setError(result.message)
    setDone(true)
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)} className="rounded-full">
        <Layers aria-hidden /> Pagar em prestações
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
            <DialogTitle>Pagar em prestações</DialogTitle>
            <DialogDescription>{invoice.description}</DialogDescription>
          </DialogHeader>

          {done ? (
            <p role="status" className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-900 dark:text-emerald-200">
              Parcelamento confirmado{enableAutopay && hasAutopayMandate ? ', com cobrança automática ativa' : ''}. Pode acompanhar cada prestação aqui na página desta fatura.
            </p>
          ) : (
            <>
              <InstallmentSimulator totalAmount={invoice.finalAmount} dueDateBase={invoice.dueDate} months={months} onMonthsChange={setMonths} idPrefix="client-plan" />
              {hasAutopayMandate && (
                <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-muted/20 p-3 text-sm">
                  <input type="checkbox" checked={enableAutopay} onChange={(e) => setEnableAutopay(e.target.checked)} className="mt-0.5 size-4 accent-[var(--primary)]" />
                  <span>
                    <strong>Cobrar automaticamente.</strong> <span className="text-muted-foreground">Usa o método de débito automático já configurado — não precisa de voltar aqui a cada vencimento.</span>
                  </span>
                </label>
              )}
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
                {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Layers aria-hidden />} Seguir com este plano
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
