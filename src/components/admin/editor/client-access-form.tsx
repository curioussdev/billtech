'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { saveClientSolutions, type SaveResult } from '@/actions/dashboard'
import { Button } from '@/components/ui/button'

type Props = { userId: string; solutions: { id: string; title: string }[]; assigned: string[] }

export function ClientAccessForm({ userId, solutions, assigned }: Props) {
  const [selected, setSelected] = useState(new Set(assigned))
  const [result, setResult] = useState<SaveResult | null>(null)
  const [pending, startTransition] = useTransition()

  if (solutions.length === 0) return <p className="text-sm text-muted-foreground">Crie soluções em «Soluções para clientes» para as poder atribuir.</p>

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => setResult(await saveClientSolutions(userId, [...selected])))
      }}
      className="grid gap-3"
    >
      <fieldset className="flex flex-wrap gap-x-6 gap-y-2">
        <legend className="sr-only">Soluções disponíveis para este cliente</legend>
        {solutions.map((s) => (
          <label key={s.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-[var(--primary)]"
              checked={selected.has(s.id)}
              onChange={(e) =>
                setSelected((prev) => {
                  const next = new Set(prev)
                  if (e.target.checked) next.add(s.id)
                  else next.delete(s.id)
                  return next
                })
              }
            />
            {s.title}
          </label>
        ))}
      </fieldset>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />} Guardar acessos
        </Button>
        <span role="status" aria-live="polite" className={result?.ok === false ? 'text-sm text-destructive' : 'text-sm text-primary'}>
          {result?.message}
        </span>
      </div>
    </form>
  )
}
