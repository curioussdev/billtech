'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, CheckCircle2, Layers, Loader2, Percent } from 'lucide-react'
import { applyDiscountToInvoice, convertToInstallments, extendDueDate, markInvoicePaidExternally, type FinanceResult } from '@/actions/payments'
import { InstallmentSimulator } from '@/components/shared/installment-simulator'
import { PaymentProgressBar } from '@/components/portal/payment-progress'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AdminInvoice } from '@/lib/finance/admin-queries'
import { formatEUR } from '@/lib/finance/labels'
import { paymentProgress } from '@/lib/finance/progress'

/** Casca comum das secções de gestão — colapsável, com o seu próprio estado de pendente/erro. */
function ActionSection({ title, icon, buttonLabel, onSubmit, defaultOpen, children }: { title: string; icon: React.ReactNode; buttonLabel: string; onSubmit: () => Promise<FinanceResult>; defaultOpen?: boolean; children: React.ReactNode }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await onSubmit()
    setPending(false)
    if (!result.ok) setError(result.message)
  }

  return (
    <details open={defaultOpen} className="group rounded-xl border border-border">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
        {icon} {title}
      </summary>
      <form onSubmit={handle} className="grid gap-3 border-t border-border p-4">
        {children}
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="sm" disabled={pending} className="w-fit rounded-lg">
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null} {buttonLabel}
        </Button>
      </form>
    </details>
  )
}

const inputClass = 'h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'

function DiscountSection({ invoice, onSuccess }: { invoice: AdminInvoice; onSuccess: () => void }) {
  const [code, setCode] = useState('')
  const [percentage, setPercentage] = useState('')
  const [reason, setReason] = useState('')

  return (
    <ActionSection
      title="Aplicar desconto"
      icon={<Percent className="size-4 text-primary" aria-hidden />}
      buttonLabel="Aplicar"
      defaultOpen
      onSubmit={async () => {
        const result = await applyDiscountToInvoice({ invoiceId: invoice.id, code: code || undefined, manualPercentage: percentage ? Number(percentage) : undefined, reason: reason || undefined })
        if (result.ok) onSuccess()
        return result
      }}
    >
      <p className="text-xs text-muted-foreground">Valor atual: {formatEUR(invoice.totalAmount)}. Use um código, OU uma percentagem manual — não os dois.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1">
          <Label htmlFor={`code-${invoice.id}`} className="text-xs">Código de desconto</Label>
          <Input id={`code-${invoice.id}`} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="FIDELIDADE10" className={inputClass} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor={`pct-${invoice.id}`} className="text-xs">ou percentagem manual (%)</Label>
          <Input id={`pct-${invoice.id}`} type="number" min={0} max={100} value={percentage} onChange={(e) => setPercentage(e.target.value)} placeholder="5" className={inputClass} />
        </div>
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`reason-${invoice.id}`} className="text-xs">Motivo (fica registado na auditoria)</Label>
        <Input id={`reason-${invoice.id}`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: cortesia por atraso na entrega" className={inputClass} />
      </div>
    </ActionSection>
  )
}

function DueDateSection({ invoice, onSuccess }: { invoice: AdminInvoice; onSuccess: () => void }) {
  const [date, setDate] = useState(invoice.dueDate)
  const [reason, setReason] = useState('')

  return (
    <ActionSection
      title="Alterar vencimento (grace period)"
      icon={<CalendarClock className="size-4 text-primary" aria-hidden />}
      buttonLabel="Guardar nova data"
      onSubmit={async () => {
        const result = await extendDueDate({ invoiceId: invoice.id, newDueDate: date, reason: reason || undefined })
        if (result.ok) onSuccess()
        return result
      }}
    >
      <div className="grid gap-1">
        <Label htmlFor={`date-${invoice.id}`} className="text-xs">Novo vencimento</Label>
        <Input id={`date-${invoice.id}`} type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`date-reason-${invoice.id}`} className="text-xs">Motivo (fica registado na auditoria)</Label>
        <Input id={`date-reason-${invoice.id}`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: pedido do cliente" className={inputClass} />
      </div>
    </ActionSection>
  )
}

function InstallmentsSection({ invoice, onSuccess }: { invoice: AdminInvoice; onSuccess: () => void }) {
  const [count, setCount] = useState(3)

  return (
    <ActionSection
      title="Converter em parcelado"
      icon={<Layers className="size-4 text-primary" aria-hidden />}
      buttonLabel="Converter"
      onSubmit={async () => {
        const result = await convertToInstallments({ invoiceId: invoice.id, numberOfInstallments: count })
        if (result.ok) onSuccess()
        return result
      }}
    >
      <InstallmentSimulator totalAmount={invoice.finalAmount} dueDateBase={invoice.dueDate} months={count} onMonthsChange={setCount} idPrefix={`convert-${invoice.id}`} />
    </ActionSection>
  )
}

function MarkPaidSection({ invoice, onSuccess }: { invoice: AdminInvoice; onSuccess: () => void }) {
  const [method, setMethod] = useState('Transferência bancária')
  const [target, setTarget] = useState('full')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const payableInstallments = invoice.installments.filter((i) => i.status !== 'pago')
  const remaining = paymentProgress(invoice).remainingAmount

  return (
    <ActionSection
      title="Marcar como pago externamente"
      icon={<CheckCircle2 className="size-4 text-primary" aria-hidden />}
      buttonLabel="Marcar como pago"
      onSubmit={async () => {
        const base = { method, notes: notes || undefined }
        const result =
          target === 'custom'
            ? await markInvoicePaidExternally({ invoiceId: invoice.id, mode: 'custom', amount: Number(amount), ...base })
            : target === 'full'
              ? await markInvoicePaidExternally({ invoiceId: invoice.id, mode: 'full', ...base })
              : await markInvoicePaidExternally({ invoiceId: invoice.id, mode: 'installment', installmentId: target, ...base })
        if (result.ok) onSuccess()
        return result
      }}
    >
      <div className="grid gap-1">
        <Label htmlFor={`target-${invoice.id}`} className="text-xs">O que foi recebido</Label>
        <select id={`target-${invoice.id}`} value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass}>
          <option value="full">O que falta da fatura ({formatEUR(remaining)})</option>
          {invoice.paymentType === 'parcelado' &&
            payableInstallments.map((i) => (
              <option key={i.id} value={i.id}>
                Parcela {i.installmentNumber} — {formatEUR(i.amount)}
              </option>
            ))}
          <option value="custom">Valor personalizado (pagamento por conta)</option>
        </select>
      </div>
      {target === 'custom' && (
        <div className="grid gap-1">
          <Label htmlFor={`amount-${invoice.id}`} className="text-xs">Valor recebido (€)</Label>
          <Input id={`amount-${invoice.id}`} type="number" min={0.01} max={remaining} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={remaining.toFixed(2)} required className={inputClass} />
          <p className="text-xs text-muted-foreground">Falta pagar: {formatEUR(remaining)}.</p>
        </div>
      )}
      <div className="grid gap-1">
        <Label htmlFor={`method-${invoice.id}`} className="text-xs">Método</Label>
        <Input id={`method-${invoice.id}`} value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Transferência, MB Way, ao balcão…" required className={inputClass} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`notes-${invoice.id}`} className="text-xs">Referência / notas (opcional)</Label>
        <Input id={`notes-${invoice.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: nº de transferência, referência MB" maxLength={300} className={inputClass} />
      </div>
    </ActionSection>
  )
}

export function InvoiceManageDialog({ invoice, open, onOpenChange }: { invoice: AdminInvoice; open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter()
  const closed = invoice.status === 'pago' || invoice.status === 'cancelado'

  function afterSuccess() {
    router.refresh()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerir fatura</DialogTitle>
          <DialogDescription>
            {invoice.description} · {invoice.clientName}
          </DialogDescription>
        </DialogHeader>

        {invoice.status !== 'cancelado' && (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <PaymentProgressBar progress={paymentProgress(invoice)} compact />
          </div>
        )}

        {closed ? (
          <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">Esta fatura já está {invoice.status === 'pago' ? 'paga' : 'cancelada'} — não há mais nada a gerir.</p>
        ) : (
          <div className="grid gap-3">
            <DiscountSection invoice={invoice} onSuccess={afterSuccess} />
            <DueDateSection invoice={invoice} onSuccess={afterSuccess} />
            {invoice.paymentType === 'unico' && <InstallmentsSection invoice={invoice} onSuccess={afterSuccess} />}
            <MarkPaidSection invoice={invoice} onSuccess={afterSuccess} />
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
