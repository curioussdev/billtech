'use client'

import { useState } from 'react'
import { markDealWon } from '@/actions/pipeline'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { dealProjectTypeLabels } from '@/lib/crm/labels'
import { DEAL_PROJECT_TYPES, type DealProjectType } from '@/types/crm'

export type WinDealPayload = { projectName: string; projectType: DealProjectType; value: number }

const selectClass = 'h-11 rounded-lg border border-input bg-background px-3 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'

export function WinDealDialog({
  open,
  leadId,
  leadLabel,
  defaultValue,
  onClose,
  onConfirm,
}: {
  open: boolean
  leadId: string
  leadLabel: string
  defaultValue: number
  onClose: () => void
  onConfirm: (payload: WinDealPayload) => void
}) {
  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState<DealProjectType>(DEAL_PROJECT_TYPES[0])
  const [value, setValue] = useState(String(defaultValue))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const parsedValue = Number(value)
    const result = await markDealWon({ leadId, leadLabel, projectName, projectType, value: parsedValue })
    setPending(false)
    if (!result.ok) return setError(result.message)
    onConfirm({ projectName, projectType, value: parsedValue })
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
            <Label htmlFor="win-value">Valor (€)</Label>
            <Input id="win-value" type="number" min={0} step="1" required value={value} onChange={(e) => setValue(e.target.value)} className="h-11 text-base" />
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
