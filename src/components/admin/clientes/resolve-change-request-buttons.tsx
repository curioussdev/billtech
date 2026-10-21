'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { resolveProfileChangeRequest } from '@/actions/profile-changes'
import { Button } from '@/components/ui/button'

export function ResolveChangeRequestButtons({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [pending, setPending] = useState<'aprovar' | 'rejeitar' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function resolve(approve: boolean) {
    const label = approve ? 'aprovar' : 'rejeitar'
    if (!window.confirm(`Confirma que quer ${label} este pedido?`)) return
    setPending(approve ? 'aprovar' : 'rejeitar')
    setError(null)
    const result = await resolveProfileChangeRequest({ requestId, approve })
    setPending(null)
    if (!result.ok) return setError(result.message)
    router.refresh()
  }

  return (
    <div className="grid gap-1">
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={() => void resolve(true)} disabled={pending !== null}>
          <Check className="size-4" aria-hidden /> {pending === 'aprovar' ? 'A aprovar…' : 'Aprovar'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => void resolve(false)} disabled={pending !== null}>
          <X className="size-4" aria-hidden /> {pending === 'rejeitar' ? 'A rejeitar…' : 'Rejeitar'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
