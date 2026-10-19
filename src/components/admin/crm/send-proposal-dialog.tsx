'use client'

import { useState } from 'react'
import { sendProposal } from '@/actions/pipeline'
import { CurrencyInput } from '@/components/shared/currency-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function SendProposalDialog({
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
  onConfirm: (value: number) => void
}) {
  const [value, setValue] = useState(String(defaultValue))
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const parsedValue = Number(value)
    const result = await sendProposal({ leadId, leadLabel, value: parsedValue, validUntil: validUntil || undefined, notes: notes || undefined })
    setPending(false)
    if (!result.ok) return setError(result.message)
    onConfirm(parsedValue)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar proposta — {leadLabel}</DialogTitle>
          <DialogDescription>Fica registado no histórico de interações e aparece como próxima ação no cartão.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="proposal-value">Valor da proposta</Label>
            <CurrencyInput id="proposal-value" value={value} onChange={setValue} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="proposal-valid-until">Válida até (opcional)</Label>
            <Input id="proposal-valid-until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="h-11 text-base" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="proposal-notes">Notas (opcional)</Label>
            <Textarea id="proposal-notes" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} className="text-base" />
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
            <Button type="submit" disabled={pending} className="h-11 rounded-xl px-6">
              {pending ? 'A enviar…' : 'Confirmar envio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
