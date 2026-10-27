'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setDealPaymentPlan } from '@/actions/pipeline'
import { InstallmentSimulator } from '@/components/shared/installment-simulator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PaymentType } from '@/types/finance'

const selectClass = 'h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'
const defaultDueDate = () => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)

/**
 * Rede de segurança para negócios já Ganhos que ficaram sem forma de pagamento definida — fechados
 * antes desta funcionalidade existir, ou sem plano indicado na altura. Cria a fatura de imediato
 * (o cliente já está associado, senão esta forma nem aparece — ver `revenue/[id]/page.tsx`).
 */
export function SetPaymentPlanForm({ leadId, totalAmount }: { leadId: string; totalAmount: number }) {
  const router = useRouter()
  const [paymentType, setPaymentType] = useState<PaymentType>('unico')
  const [installments, setInstallments] = useState(3)
  const [dueDate, setDueDate] = useState(defaultDueDate)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await setDealPaymentPlan({ leadId, paymentType, dueDate, ...(paymentType === 'parcelado' ? { installments } : {}) })
    setPending(false)
    if (!result.ok) return setError(result.message)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-dashed border-border p-3">
      <p className="text-xs text-muted-foreground">Ainda sem forma de pagamento definida — crie a fatura agora.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1">
          <Label htmlFor={`plan-type-${leadId}`} className="text-xs">Forma de pagamento</Label>
          <select id={`plan-type-${leadId}`} value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentType)} className={selectClass}>
            <option value="unico">Pagamento único</option>
            <option value="parcelado">Parcelado</option>
          </select>
        </div>
        <div className="grid gap-1">
          <Label htmlFor={`plan-due-${leadId}`} className="text-xs">{paymentType === 'parcelado' ? '1ª parcela vence em' : 'Vencimento'}</Label>
          <Input id={`plan-due-${leadId}`} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 text-sm" />
        </div>
      </div>
      {paymentType === 'parcelado' && <InstallmentSimulator totalAmount={totalAmount} dueDateBase={dueDate} months={installments} onMonthsChange={setInstallments} idPrefix={`plan-${leadId}`} />}
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="sm" disabled={pending} className="w-fit rounded-lg">
        {pending ? 'A criar…' : 'Criar fatura'}
      </Button>
    </form>
  )
}
