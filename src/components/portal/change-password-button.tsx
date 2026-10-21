'use client'

import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { requestPasswordChange } from '@/actions/clients'
import { Button } from '@/components/ui/button'

/** Pede a alteração de password por confirmação de email — nunca muda a password diretamente aqui. */
export function ChangePasswordButton() {
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function request() {
    setPending(true)
    setError(null)
    const result = await requestPasswordChange()
    setPending(false)
    if (!result.ok) return setError(result.message)
    setSent(true)
  }

  if (sent) {
    return (
      <p role="status" className="rounded-lg bg-emerald-500/10 p-3 text-sm font-medium text-emerald-800 dark:text-emerald-300">
        Enviámos um email com um link para definir uma nova password.
      </p>
    )
  }

  return (
    <div className="grid gap-2">
      <Button type="button" variant="outline" onClick={request} disabled={pending} className="w-fit">
        <KeyRound className="size-4" aria-hidden /> {pending ? 'A enviar…' : 'Alterar password'}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
