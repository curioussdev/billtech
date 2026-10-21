'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { requestProfileChange, setNif } from '@/actions/profile-changes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Field = 'nif' | 'email'

const fieldLabel: Record<Field, string> = { nif: 'NIF', email: 'Email' }

function formatValue(field: Field, value: string): string {
  return field === 'nif' ? value.replace(/(\d{3})(?=\d)/g, '$1 ').trim() : value
}

/** Formulário de pedido de alteração (NIF ou email) — nunca aplica diretamente, só regista o pedido. */
function RequestChangeForm({ field, onClose }: { field: Field; onClose: () => void }) {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [reason, setReason] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await requestProfileChange({ field, requestedValue: value, reason: reason || undefined })
    setPending(false)
    if (!result.ok) return setError(result.message)
    router.refresh()
    onClose()
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl bg-muted/50 p-4">
      <div className="grid gap-1.5">
        <Label htmlFor={`request-${field}-value`}>Novo {fieldLabel[field].toLowerCase()}</Label>
        <Input id={`request-${field}-value`} required value={value} onChange={(e) => setValue(e.target.value)} className="h-10 text-base" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`request-${field}-reason`}>Motivo (opcional)</Label>
        <Textarea id={`request-${field}-reason`} rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'A enviar…' : 'Enviar pedido'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export type PendingChangeRequest = { requestedValue: string; createdAt: string }

/**
 * Campo sensível (NIF/email): inalterável depois de preenchido — só por pedido aprovado por um
 * admin. O NIF ainda pode ser preenchido diretamente da primeira vez (`allowFirstFill`).
 */
export function SensitiveField({
  field,
  currentValue,
  pendingRequest,
  allowFirstFill,
}: {
  field: Field
  currentValue: string | null
  pendingRequest?: PendingChangeRequest
  allowFirstFill?: boolean
}) {
  const router = useRouter()
  const [requesting, setRequesting] = useState(false)
  const [firstFillValue, setFirstFillValue] = useState('')
  const [firstFillPending, setFirstFillPending] = useState(false)
  const [firstFillError, setFirstFillError] = useState<string | null>(null)

  if (!currentValue && allowFirstFill) {
    async function saveFirstFill(e: React.FormEvent) {
      e.preventDefault()
      setFirstFillPending(true)
      setFirstFillError(null)
      const result = await setNif(firstFillValue)
      setFirstFillPending(false)
      if (!result.ok) return setFirstFillError(result.message)
      router.refresh()
    }

    return (
      <form onSubmit={saveFirstFill} className="grid gap-2">
        <Label htmlFor="first-fill-nif">{fieldLabel[field]}</Label>
        <div className="flex flex-wrap gap-2">
          <Input id="first-fill-nif" required maxLength={9} value={firstFillValue} onChange={(e) => setFirstFillValue(e.target.value)} className="h-11 w-48 text-base" placeholder="123456789" />
          <Button type="submit" disabled={firstFillPending} className="h-11">
            {firstFillPending ? 'A guardar…' : 'Guardar'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Depois de guardado, só pode ser alterado por pedido aprovado pela equipa BillTech.</p>
        {firstFillError && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {firstFillError}
          </p>
        )}
      </form>
    )
  }

  return (
    <div className="grid gap-2">
      <Label>{fieldLabel[field]}</Label>
      <Input value={currentValue ?? '—'} readOnly className="h-11 bg-muted text-base" />
      {pendingRequest ? (
        <p className="text-xs text-muted-foreground">
          Pedido de alteração para <strong>{formatValue(field, pendingRequest.requestedValue)}</strong> pendente de aprovação.
        </p>
      ) : requesting ? (
        <RequestChangeForm field={field} onClose={() => setRequesting(false)} />
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setRequesting(true)} className="w-fit">
          Solicitar alteração
        </Button>
      )}
    </div>
  )
}
