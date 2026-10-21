import { Briefcase, CalendarCheck, Euro, FileText, Phone, Target } from 'lucide-react'
import { ChangeBadge, KpiCard } from '@/components/admin/dashboard/kpi-card'
import { formatEUR, formatInt, formatPct } from '@/lib/admin/format'
import { cn } from '@/lib/utils'
import type { CrmOverview } from '@/lib/crm/overview'

/** Base partilhada pelos cartões de meta com barra de progresso (diárias/semanais de cold calls, reuniões, propostas). */
function GoalPaceCard({
  title,
  icon,
  current,
  target,
  formatValue = formatInt,
  unitHint,
  delay,
}: {
  title: string
  icon: React.ReactNode
  current: number
  target: number
  formatValue?: (n: number) => string
  unitHint: string
  delay?: number
}) {
  const pacePct = target > 0 ? (current / target) * 100 : 0
  const progress = Math.min(100, Math.round(pacePct))
  const behind = pacePct < 50
  const remaining = Math.max(0, target - current)
  return (
    <KpiCard title={title} icon={icon} delay={delay}>
      <p className="text-3xl font-black tabular-nums">
        {formatValue(current)} <span className="text-lg font-semibold text-muted-foreground">/ {formatValue(target)}</span>
      </p>
      <p className="text-xs text-muted-foreground">{remaining > 0 ? `Faltam ${formatValue(remaining)} ${unitHint}` : 'Meta batida!'}</p>
      <div role="progressbar" aria-label={`Progresso de ${title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-[width] duration-700', behind ? 'bg-rose-500' : 'bg-emerald-500')} style={{ width: `${progress}%` }} />
      </div>
    </KpiCard>
  )
}

export function RevenueMonthCard({ data, delay }: { data: CrmOverview['revenueMonth']; delay?: number }) {
  const progress = Math.min(100, Math.round(data.progressPct))
  return (
    <KpiCard title="Receita de negócios fechados (mês)" icon={<Euro className="size-4" />} delay={delay}>
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
        Meta mensal: {formatPct(data.target)} · {data.won} {data.won === 1 ? 'ganho' : 'ganhos'} / {data.decided} propostas decididas (30 dias)
      </p>
    </KpiCard>
  )
}

export function ColdCallsPaceCard({ data, delay }: { data: CrmOverview['coldCallsToday']; delay?: number }) {
  return <GoalPaceCard title="Cold Calls (Hoje)" icon={<Phone className="size-4" />} current={data.current} target={data.target} unitHint="ligações para bater a meta diária" delay={delay} />
}

export function MeetingsTodayCard({ data, delay }: { data: CrmOverview['meetingsToday']; delay?: number }) {
  return <GoalPaceCard title="Reuniões (Hoje)" icon={<CalendarCheck className="size-4" />} current={data.current} target={data.target} unitHint="reuniões para bater a meta diária" delay={delay} />
}

export function ColdCallsWeekCard({ data, delay }: { data: CrmOverview['coldCallsWeek']; delay?: number }) {
  return <GoalPaceCard title="Cold Calls (Semana)" icon={<Phone className="size-4" />} current={data.current} target={data.target} unitHint="ligações para bater a meta semanal" delay={delay} />
}

export function MeetingsWeekCard({ data, delay }: { data: CrmOverview['meetingsWeek']; delay?: number }) {
  return <GoalPaceCard title="Reuniões (Semana)" icon={<CalendarCheck className="size-4" />} current={data.current} target={data.target} unitHint="reuniões para bater a meta semanal" delay={delay} />
}

export function ProposalsWeekCard({ data, delay }: { data: CrmOverview['proposalsWeek']; delay?: number }) {
  return <GoalPaceCard title="Propostas Enviadas (Semana)" icon={<FileText className="size-4" />} current={data.current} target={data.target} formatValue={formatEUR} unitHint="em propostas para bater a meta semanal" delay={delay} />
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
