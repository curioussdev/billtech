'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gift, Loader2 } from 'lucide-react'
import { addLoyaltyPoints } from '@/actions/payments'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatEUR, loyaltyTierLabels } from '@/lib/finance/labels'
import type { ClientFinanceSummary } from '@/types/finance'

const inputClass = 'h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'

function SendPointsDialog({ summary, open, onOpenChange }: { summary: ClientFinanceSummary; open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter()
  const [points, setPoints] = useState('50')
  const [reason, setReason] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await addLoyaltyPoints({ clientId: summary.clientId, points: Number(points), reason })
    setPending(false)
    if (!result.ok) return setError(result.message)
    router.refresh()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar pontos de bónus</DialogTitle>
          <DialogDescription>{summary.clientName} — atualmente {summary.loyalty.loyaltyPoints.toLocaleString('pt-PT')} pontos, nível {loyaltyTierLabels[summary.loyalty.loyaltyTier]}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="points">Pontos a atribuir</Label>
            <Input id="points" type="number" min={1} value={points} onChange={(e) => setPoints(e.target.value)} required className={inputClass} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="reason">Motivo (fica registado na auditoria)</Label>
            <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: compensação por atraso, fidelização ativa" required minLength={3} className={inputClass} />
          </div>
          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Gift aria-hidden />} Enviar pontos
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Clientes ordenados por total gasto — para o admin decidir a quem vale a pena reter ativamente. */
export function LoyaltySection({ summaries }: { summaries: ClientFinanceSummary[] }) {
  const [sending, setSending] = useState<ClientFinanceSummary | null>(null)

  if (summaries.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border p-8 text-muted-foreground">Ainda sem clientes com histórico financeiro.</p>
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Clientes ordenados por total gasto</caption>
          <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">Cliente</th>
              <th scope="col" className="px-4 py-3">Nível</th>
              <th scope="col" className="px-4 py-3 text-right">Total gasto</th>
              <th scope="col" className="px-4 py-3 text-right">Pontos</th>
              <th scope="col" className="px-4 py-3 text-right">Em aberto</th>
              <th scope="col" className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {summaries.map((s) => (
              <tr key={s.clientId} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <span className="block font-medium">{s.company || s.clientName}</span>
                  <span className="block text-xs text-muted-foreground">{s.clientName}</span>
                </td>
                <td className="px-4 py-3">{loyaltyTierLabels[s.loyalty.loyaltyTier]}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatEUR(s.loyalty.totalSpent)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{s.loyalty.loyaltyPoints.toLocaleString('pt-PT')}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {s.openAmount > 0 ? formatEUR(s.openAmount) : '—'}
                  {s.overdueCount > 0 && <span className="ml-1 text-xs text-destructive">({s.overdueCount} atrasada{s.overdueCount > 1 ? 's' : ''})</span>}
                </td>
                <td className="px-4 py-3">
                  <Button type="button" size="sm" variant="outline" onClick={() => setSending(s)}>
                    <Gift aria-hidden /> Enviar pontos
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sending && <SendPointsDialog summary={sending} open={Boolean(sending)} onOpenChange={(v) => !v && setSending(null)} />}
    </>
  )
}
