'use client'

import { useState } from 'react'
import { sendContractToClient } from '@/actions/contracts'
import { ContractDocument, type ContractData } from '@/components/contracts/contract-document'
import { PrintButton } from '@/components/portal/print-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/finance/labels'
import type { PaymentType } from '@/types/finance'

const inputClass = 'h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'

export type ContractGeneratorInitial = {
  clientName: string
  clientCompany: string
  clientNif: string | null
  projectName: string
  scope: string
  totalAmount: number
  paymentType: PaymentType
  installments: number | null
  startDate: string
  dueDate: string | null
  sentAt: string | null
}

export function ContractGenerator({ projectId, initial }: { projectId: string; initial: ContractGeneratorInitial }) {
  const [scope, setScope] = useState(initial.scope)
  const [totalAmount, setTotalAmount] = useState(String(initial.totalAmount || ''))
  const [paymentType, setPaymentType] = useState<PaymentType>(initial.paymentType)
  const [installments, setInstallments] = useState(String(initial.installments ?? 3))
  const [startDate, setStartDate] = useState(initial.startDate)
  const [dueDate, setDueDate] = useState(initial.dueDate ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentNow, setSentNow] = useState(false)

  const previewData: ContractData = {
    clientName: initial.clientName,
    clientCompany: initial.clientCompany,
    clientNif: initial.clientNif,
    projectName: initial.projectName,
    scope: scope || '[descreva o âmbito do projeto]',
    totalAmount: Number(totalAmount) || 0,
    paymentType,
    installments: paymentType === 'parcelado' ? Number(installments) : null,
    startDate,
    dueDate: dueDate || null,
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await sendContractToClient({
      projectId,
      scope,
      totalAmount: Number(totalAmount),
      paymentType,
      startDate,
      ...(paymentType === 'parcelado' ? { installments: Number(installments) } : {}),
      ...(dueDate ? { dueDate } : {}),
    })
    setPending(false)
    if (!result.ok) return setError(result.message)
    setSentNow(true)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <form onSubmit={submit} className="grid gap-4 print:hidden">
        <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
          <p className="font-semibold">{initial.clientCompany || initial.clientName}</p>
          <p className="text-muted-foreground">{initial.clientName}</p>
          {initial.clientNif ? (
            <p className="text-muted-foreground">NIF {initial.clientNif}</p>
          ) : (
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Cliente sem NIF definido — o contrato ficará com este campo em falta.</p>
          )}
        </div>

        <div className="grid gap-1">
          <Label htmlFor="contract-scope" className="text-xs">Âmbito do projeto</Label>
          <textarea id="contract-scope" value={scope} onChange={(e) => setScope(e.target.value)} rows={4} maxLength={2000} required className={`${inputClass} h-auto py-2`} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <Label htmlFor="contract-amount" className="text-xs">Valor total (€)</Label>
            <Input id="contract-amount" type="number" min={0} step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required className="h-9 text-sm" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="contract-payment-type" className="text-xs">Forma de pagamento</Label>
            <select id="contract-payment-type" value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentType)} className={inputClass}>
              <option value="unico">Pagamento único</option>
              <option value="parcelado">Parcelado</option>
            </select>
          </div>
        </div>

        {paymentType === 'parcelado' && (
          <div className="grid max-w-40 gap-1">
            <Label htmlFor="contract-installments" className="text-xs">Nº de parcelas</Label>
            <Input id="contract-installments" type="number" min={2} max={12} value={installments} onChange={(e) => setInstallments(e.target.value)} className="h-9 text-sm" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <Label htmlFor="contract-start" className="text-xs">Data de início</Label>
            <Input id="contract-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="h-9 text-sm" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="contract-due" className="text-xs">Entrega prevista (opcional)</Label>
            <Input id="contract-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 text-sm" />
          </div>
        </div>

        {initial.sentAt && !sentNow && <p className="text-sm text-muted-foreground">Último envio: {formatDate(initial.sentAt)}. Reenviar substitui esta versão.</p>}
        {sentNow && <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Contrato enviado ao cliente por email.</p>}
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <PrintButton />
          <Button type="submit" disabled={pending} className="rounded-full">
            {pending ? 'A enviar…' : initial.sentAt ? 'Corrigir e reenviar' : 'Enviar ao cliente'}
          </Button>
        </div>
      </form>

      <div className="rounded-2xl border border-border bg-card p-8 print:border-0 print:p-0">
        <ContractDocument data={previewData} />
      </div>
    </div>
  )
}
