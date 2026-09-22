'use client'

import { useState } from 'react'
import { markDealLost } from '@/actions/pipeline'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { lossReasonLabels } from '@/lib/crm/labels'
import { LOSS_REASONS, type LossReason } from '@/types/crm'

export function LostDealDialog({
  open,
  leadId,
  leadLabel,
  onClose,
  onConfirm,
}: {
  open: boolean
  leadId: string
  leadLabel: string
  onClose: () => void
  onConfirm: (reason: LossReason) => void
}) {
  const [reason, setReason] = useState<LossReason>(LOSS_REASONS[0])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const result = await markDealLost({ leadId, leadLabel, reason })
    setPending(false)
    if (!result.ok) return setError(result.message)
    onConfirm(reason)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Negócio perdido — {leadLabel}</DialogTitle>
          <DialogDescription>Escolha o motivo. Ajuda a perceber padrões nas próximas prospecções.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <fieldset className="grid gap-2">
            <legend className="sr-only">Motivo da perda</legend>
            {LOSS_REASONS.map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/10">
                <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="size-4 accent-[var(--primary)]" />
                {lossReasonLabels[r]}
              </label>
            ))}
          </fieldset>
          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={pending} className="h-11 rounded-xl px-6">
              {pending ? 'A confirmar…' : 'Confirmar Perdido'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
