'use client'

import { useState } from 'react'
import { markDealWon } from '@/actions/pipeline'
import { InstallmentSimulator } from '@/components/shared/installment-simulator'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { dealProjectTypeLabels } from '@/lib/crm/labels'
import { DEAL_PROJECT_TYPES, type DealProjectType } from '@/types/crm'
import type { PaymentType } from '@/types/finance'

export type WinDealPayload = { projectName: string; projectType: DealProjectType; value: number; invoiceCreated: boolean }

const selectClass = 'h-11 rounded-lg border border-input bg-background px-3 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'
const defaultDueDate = () => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)

export function WinDealDialog({
  open,
  leadId,
  leadLabel,
  defaultValue,
  hasClient,
  onClose,
  onConfirm,
}: {
  open: boolean
  leadId: string
  leadLabel: string
  defaultValue: number
  /** Se o negócio já tem conta de cliente associada — determina se a fatura é criada já, ou só quando associar depois. */
  hasClient: boolean
  onClose: () => void
  onConfirm: (payload: WinDealPayload) => void
}) {
  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState<DealProjectType>(DEAL_PROJECT_TYPES[0])
  const [value, setValue] = useState(String(defaultValue))
  const [planMode, setPlanMode] = useState<'nenhum' | PaymentType>('nenhum')
  const [installments, setInstallments] = useState(3)
  const [dueDate, setDueDate] = useState(defaultDueDate)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const parsedValue = Number(value)
    const result = await markDealWon({
      leadId,
      leadLabel,
      projectName,
      projectType,
      value: parsedValue,
      ...(planMode !== 'nenhum' ? { paymentType: planMode, dueDate, ...(planMode === 'parcelado' ? { installments } : {}) } : {}),
    })
    setPending(false)
    if (!result.ok) return setError(result.message)
    onConfirm({ projectName, projectType, value: parsedValue, invoiceCreated: result.invoiceCreated })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Negócio ganho — {leadLabel}</DialogTitle>
          <DialogDescription>Confirme os dados do projeto para fechar como Ganho.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="win-project-name">Nome do projeto</Label>
            <Input id="win-project-name" required maxLength={120} value={projectName} onChange={(e) => setProjectName(e.target.value)} className="h-11 text-base" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="win-project-type">Tipo de projeto</Label>
            <select id="win-project-type" value={projectType} onChange={(e) => setProjectType(e.target.value as DealProjectType)} className={selectClass}>
              {DEAL_PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {dealProjectTypeLabels[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="win-value">Valor final fechado (€)</Label>
            <Input id="win-value" type="number" min={0} step="1" required value={value} onChange={(e) => setValue(e.target.value)} className="h-11 text-base" />
            <p className="text-xs text-muted-foreground">Pode ser diferente do valor proposto — é o que foi negociado e fechado de verdade.</p>
          </div>

          <div className="grid gap-1.5 rounded-xl border border-border bg-muted/30 p-3">
            <Label htmlFor="win-payment-type">Forma de pagamento (opcional)</Label>
            <select id="win-payment-type" value={planMode} onChange={(e) => setPlanMode(e.target.value as 'nenhum' | PaymentType)} className={selectClass}>
              <option value="nenhum">Não definir agora</option>
              <option value="unico">Pagamento único</option>
              <option value="parcelado">Parcelado</option>
            </select>
            {planMode !== 'nenhum' && (
              <div className="mt-2 grid gap-3">
                <div className="grid gap-1 sm:max-w-xs">
                  <Label htmlFor="win-due-date" className="text-xs">{planMode === 'parcelado' ? '1ª parcela vence em' : 'Vencimento'}</Label>
                  <Input id="win-due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 text-sm" />
                </div>
                {planMode === 'parcelado' && (
                  <InstallmentSimulator totalAmount={Number(value) || 0} dueDateBase={dueDate} months={installments} onMonthsChange={setInstallments} idPrefix="win-deal" />
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {hasClient
                ? 'Cria já a fatura no financeiro, com o valor acima.'
                : 'Este negócio ainda não tem conta de cliente associada — a fatura é criada automaticamente assim que associar uma.'}
            </p>
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || !projectName.trim()} className="h-11 rounded-xl px-6">
              {pending ? 'A confirmar…' : 'Confirmar Ganho'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
