'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Bell, CreditCard, History, Landmark, Loader2, Search, Zap } from 'lucide-react'
import { chargeInstallmentNow, sendAutopayPreNotice } from '@/actions/autopay'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDate, formatEUR } from '@/lib/finance/labels'
import type { AutopayDueItem, AutopayMandateSummary, AutopayOverviewRow } from '@/lib/finance/autopay-queries'

function ChargeNowButton({ invoiceId, installmentId }: { invoiceId: string; installmentId: string | null }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function charge() {
    if (!window.confirm('Cobrar esta parcela agora, pelo método de débito automático guardado do cliente?')) return
    setPending(true)
    setError(null)
    const result = await chargeInstallmentNow({ invoiceId, installmentId: installmentId ?? '' })
    setPending(false)
    if (!result.ok) return setError(result.message)
    router.refresh()
  }

  return (
    <div className="grid gap-1">
      <Button type="button" size="sm" onClick={charge} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Zap aria-hidden />} Cobrar agora
      </Button>
      {error && (
        <p role="alert" className="max-w-56 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function NotifyButton({ item }: { item: AutopayDueItem }) {
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function notify() {
    setPending(true)
    setError(null)
    const result = await sendAutopayPreNotice({ invoiceId: item.invoiceId, installmentId: item.installmentId ?? '', amountEur: item.amount, dueDate: item.dueDate })
    setPending(false)
    if (!result.ok) return setError(result.message)
    setSent(true)
  }

  if (sent) return <span className="text-xs font-medium text-primary">Aviso enviado.</span>
  return (
    <div className="grid gap-1">
      <Button type="button" variant="outline" size="sm" onClick={notify} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Bell aria-hidden />} Enviar aviso
      </Button>
      {error && (
        <p role="alert" className="max-w-56 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function MandateHistory({ history }: { history: AutopayMandateSummary[] }) {
  if (history.length <= 1) return null
  return (
    <details className="rounded-xl border border-border/60 bg-muted/10 text-sm">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-semibold text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
        <History className="size-3.5" aria-hidden /> Histórico de mandatos ({history.length})
      </summary>
      <ul className="grid gap-1 border-t border-border/60 px-3 py-2">
        {history.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {m.methodType === 'card' ? <CreditCard className="size-3 shrink-0" aria-hidden /> : <Landmark className="size-3 shrink-0" aria-hidden />}
              {m.methodType === 'card' ? 'Cartão' : 'IBAN'} · criado {formatDate(m.createdAt)}
            </span>
            <span>{m.status === 'ativo' ? <span className="font-medium text-primary">Ativo</span> : `Revogado ${m.revokedAt ? formatDate(m.revokedAt) : ''}`}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

/** Clientes com débito automático ativo: próxima cobrança por um clique, avisos prévios (SEPA exige-o por lei) e falhas recentes a precisar de atenção. */
export function AutopaySection({ rows }: { rows: AutopayOverviewRow[] }) {
  const [query, setQuery] = useState('')

  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Ainda ninguém configurou débito automático.</p>

  const cardCount = rows.filter((r) => r.mandate.methodType === 'card').length
  const sepaCount = rows.length - cardCount
  const q = query.trim().toLowerCase()
  const filtered = q ? rows.filter((r) => `${r.clientName} ${r.clientEmail}`.toLowerCase().includes(q)) : rows

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium">
            <CreditCard className="size-3.5" aria-hidden /> {cardCount} cartão
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium">
            <Landmark className="size-3.5" aria-hidden /> {sepaCount} IBAN
          </span>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar cliente…" className="h-9 pl-8 text-sm" aria-label="Pesquisar cliente com débito automático" />
        </div>
      </div>

      {filtered.length === 0 && <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>}

      {filtered.map((row) => (
        <div key={row.clientId} className="grid gap-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <p className="font-semibold">{row.clientName}</p>
            <p className="text-xs text-muted-foreground">
              {row.clientEmail} · {row.mandate.methodType === 'card' ? 'Cartão guardado' : 'Débito direto (IBAN)'}
            </p>
          </div>

          <MandateHistory history={row.history} />

          {row.payable.length > 0 ? (
            <div className="grid gap-1.5">
              <p className="text-xs font-semibold text-muted-foreground">Por cobrar — qualquer uma pode ser cobrada agora, não só a mais próxima</p>
              <ul className="grid gap-1.5">
                {row.payable.map((item) => (
                  <li key={`${item.invoiceId}-${item.installmentId ?? 'full'}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
                    <span>
                      <span className="font-medium">{item.description}</span>
                      <span className="block text-xs text-muted-foreground">
                        Vence {formatDate(item.dueDate)} · {formatEUR(item.amount)}
                      </span>
                    </span>
                    <ChargeNowButton invoiceId={item.invoiceId} installmentId={item.installmentId} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhuma fatura com cobrança automática ativa neste momento.</p>
          )}

          {row.upcomingNotices.length > 0 && (
            <div className="grid gap-1.5">
              <p className="text-xs font-semibold text-muted-foreground">A vencer nos próximos dias — pode avisar o cliente antes de cobrar</p>
              <ul className="grid gap-1.5">
                {row.upcomingNotices.map((item) => (
                  <li key={`${item.invoiceId}-${item.installmentId ?? 'full'}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-2.5 text-sm">
                    <span>
                      <span className="font-medium">{item.description}</span>
                      <span className="block text-xs text-muted-foreground">
                        Vence {formatDate(item.dueDate)} · {formatEUR(item.amount)}
                      </span>
                    </span>
                    <NotifyButton item={item} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {row.recentFailures.length > 0 && (
            <ul className="grid gap-1.5">
              {row.recentFailures.map((f) => (
                <li key={f.paymentId} className="flex items-start gap-2 rounded-lg bg-rose-500/10 p-2 text-xs text-rose-800 dark:text-rose-300">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>
                    {f.description} — {formatEUR(f.amount)} · {f.notes || 'falhou'} ({formatDate(f.createdAt)})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
