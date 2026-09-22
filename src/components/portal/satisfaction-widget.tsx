'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Star } from 'lucide-react'
import { submitSatisfaction } from '@/actions/portal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

/** Pedido de avaliação depois de um pedido ser concluído — 1 clique para 5 estrelas, comentário opcional. */
export function SatisfactionWidget({ requestId }: { requestId: string }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit() {
    if (rating === 0) return setError('Escolha uma pontuação de 1 a 5.')
    setPending(true)
    setError(null)
    const result = await submitSatisfaction({ requestId, rating, comment: comment || undefined })
    setPending(false)
    if (!result.ok) return setError(result.message)
    setDone(true)
  }

  if (done) {
    return (
      <p role="status" className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-900 dark:text-emerald-200">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden /> Obrigado pela avaliação!
      </p>
    )
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-5">
      <p className="font-semibold">Este pedido ficou concluído. Como correu?</p>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Avaliação de 1 a 5 estrelas">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} de 5 estrelas`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="rounded p-1 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star className={cn('size-7 transition-colors', (hover || rating) >= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} aria-hidden />
          </button>
        ))}
      </div>
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} maxLength={500} placeholder="Algum comentário? (opcional)" className="text-base" />
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="button" onClick={submit} disabled={pending} className="w-fit rounded-xl">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null} Enviar avaliação
      </Button>
    </div>
  )
}
