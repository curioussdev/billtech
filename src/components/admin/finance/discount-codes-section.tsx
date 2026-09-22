'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Ticket } from 'lucide-react'
import { createDiscountCode } from '@/actions/payments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatEUR } from '@/lib/finance/labels'
import type { DiscountCode } from '@/types/finance'

const inputClass = 'h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'

function CreateCodeForm() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [percentage, setPercentage] = useState('')
  const [fixedAmount, setFixedAmount] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await createDiscountCode({ code, percentage: percentage || undefined, fixedAmount: fixedAmount || undefined, usageLimit: usageLimit || undefined })
    setPending(false)
    if (!result.ok) return setError(result.message)
    setCode('')
    setPercentage('')
    setFixedAmount('')
    setUsageLimit('')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-dashed border-border p-4 sm:grid-cols-[1fr_auto_auto_auto_auto]">
      <div className="grid gap-1">
        <Label htmlFor="new-code" className="text-xs">Código</Label>
        <Input id="new-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="FIDELIDADE15" required minLength={3} className={inputClass} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="new-pct" className="text-xs">Percentagem (%)</Label>
        <Input id="new-pct" type="number" min={1} max={100} value={percentage} onChange={(e) => setPercentage(e.target.value)} placeholder="10" className={inputClass} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="new-fixed" className="text-xs">ou valor fixo (€)</Label>
        <Input id="new-fixed" type="number" min={0.01} step="0.01" value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)} placeholder="50" className={inputClass} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="new-limit" className="text-xs">Limite de usos</Label>
        <Input id="new-limit" type="number" min={1} value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="Ilimitado" className={inputClass} />
      </div>
      <div className="flex items-end">
        <Button type="submit" size="sm" disabled={pending} className="w-full">
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />} Criar
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive sm:col-span-5">
          {error}
        </p>
      )}
    </form>
  )
}

export function DiscountCodesSection({ codes }: { codes: DiscountCode[] }) {
  return (
    <div className="grid gap-4">
      <CreateCodeForm />
      {codes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ainda sem códigos de desconto.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {codes.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm">
              <span className="flex items-center gap-2 font-mono font-semibold">
                <Ticket className={c.isActive ? 'size-4 text-primary' : 'size-4 text-muted-foreground'} aria-hidden />
                {c.code}
              </span>
              <span className="text-right text-xs text-muted-foreground">
                <span className="block font-medium text-foreground">{c.percentage !== null ? `${c.percentage}%` : formatEUR(c.fixedAmount ?? 0)}</span>
                {c.usedCount}
                {c.usageLimit !== null ? `/${c.usageLimit}` : ''} usos {!c.isActive && '· inativo'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
