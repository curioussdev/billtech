import { Briefcase, Euro, Phone, Target } from 'lucide-react'
import { ChangeBadge, KpiCard } from '@/components/admin/dashboard/kpi-card'
import { formatEUR, formatInt, formatPct } from '@/lib/admin/format'
import { cn } from '@/lib/utils'
import type { CrmOverview } from '@/lib/crm/overview'

export function RevenueMonthCard({ data, delay }: { data: CrmOverview['revenueMonth']; delay?: number }) {
  const progress = Math.min(100, Math.round(data.progressPct))
  return (
    <KpiCard title="Receita do Mês" icon={<Euro className="size-4" />} delay={delay}>
      <p className="text-3xl font-black tabular-nums">{formatEUR(data.current)}</p>
      <p className="text-xs text-muted-foreground">
        Meta: {formatEUR(data.target)} ({formatPct(data.progressPct)} alcançado)
      </p>
      <div role="progressbar" aria-label="Progresso da receita do mês" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-700" style={{ width: `${progress}%` }} />
      </div>
    </KpiCard>
  )
}

export function WinRateCard({ data, delay }: { data: CrmOverview['winRate']; delay?: number }) {
  return (
    <KpiCard title="Win Rate" icon={<Target className="size-4" />} delay={delay}>
      <div className="flex items-end justify-between gap-2">
        <p className="text-3xl font-black tabular-nums">{formatPct(data.value)}</p>
        {data.changePct !== null && <ChangeBadge value={data.changePct} />}
      </div>
      <p className="text-xs text-muted-foreground">
        {data.won} {data.won === 1 ? 'ganho' : 'ganhos'} / {data.decided} propostas decididas (últimos 30 dias)
      </p>
    </KpiCard>
  )
}

export function ColdCallsPaceCard({ data, delay }: { data: CrmOverview['coldCallsToday']; delay?: number }) {
  const progress = Math.min(100, Math.round(data.pacePct))
  const behind = data.pacePct < 50
  const remaining = Math.max(0, data.target - data.current)
  return (
    <KpiCard title="Pace de Cold Calls (Hoje)" icon={<Phone className="size-4" />} delay={delay}>
      <p className="text-3xl font-black tabular-nums">
        {formatInt(data.current)} <span className="text-lg font-semibold text-muted-foreground">/ {formatInt(data.target)}</span>
      </p>
      <p className="text-xs text-muted-foreground">{remaining > 0 ? `Faltam ${remaining} ligações para bater a meta diária` : 'Meta diária batida!'}</p>
      <div
        role="progressbar"
        aria-label="Progresso das cold calls de hoje face à meta"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div className={cn('h-full rounded-full transition-[width] duration-700', behind ? 'bg-rose-500' : 'bg-emerald-500')} style={{ width: `${progress}%` }} />
      </div>
    </KpiCard>
  )
}

export function PipelineCard({ data, delay }: { data: CrmOverview['pipeline']; delay?: number }) {
  return (
    <KpiCard title="Pipeline Atual" icon={<Briefcase className="size-4" />} delay={delay}>
      <p className="text-3xl font-black tabular-nums">{formatEUR(data.value)}</p>
      <p className="text-xs text-muted-foreground">
        {data.openCount} {data.openCount === 1 ? 'proposta' : 'propostas'} em aberto
      </p>
      <p className="text-xs text-muted-foreground">
        {data.qualifying} em qualificação, {data.finalNegotiation} em negociação final
      </p>
    </KpiCard>
  )
}
