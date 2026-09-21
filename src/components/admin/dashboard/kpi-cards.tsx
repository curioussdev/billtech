import { Euro, Globe2, Rocket } from 'lucide-react'
import { ChangeBadge, KpiCard } from '@/components/admin/dashboard/kpi-card'
import { Sparkline } from '@/components/admin/dashboard/sparkline'
import { formatEUR, formatInt, formatPct, projectStatusLabels } from '@/lib/admin/format'
import { cn } from '@/lib/utils'
import type { ProjectsKpi, RevenueKpi, TrafficKpi } from '@/types/analytics'
import { PROJECT_STATUSES, type ProjectStatus } from '@/types/project'

export function TrafficCard({ data, delay }: { data: TrafficKpi; delay?: number }) {
  return (
    <KpiCard title="Visitantes da landing (30 dias)" icon={<Globe2 className="size-4" />} delay={delay}>
      <div className="flex items-end justify-between gap-2">
        <p className="text-3xl font-black tabular-nums">{formatInt(data.visits)}</p>
        <ChangeBadge value={data.changePct} />
      </div>
      <Sparkline data={data.series} label={`Evolução diária de visitas nos últimos 30 dias, total ${formatInt(data.visits)}`} />
      <p className="text-xs text-muted-foreground">Sessões únicas · período anterior: {formatInt(data.previousVisits)}</p>
    </KpiCard>
  )
}

export function RevenueCard({ data, delay }: { data: RevenueKpi; delay?: number }) {
  const progress = Math.min(100, Math.round(data.targetProgressPct))
  const onTrack = data.projectedMonthEnd >= data.monthlyTarget

  return (
    <KpiCard title="Receita do mês" icon={<Euro className="size-4" />} delay={delay}>
      <div className="flex items-end justify-between gap-2">
        <p className="text-3xl font-black tabular-nums">{formatEUR(data.monthToDate)}</p>
        <ChangeBadge value={data.changePct} />
      </div>
      <p className="text-xs text-muted-foreground">
        Projeção de fecho: <strong className="font-semibold text-foreground">{formatEUR(data.projectedMonthEnd)}</strong> · variação face ao mês anterior
      </p>
      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">Meta {formatEUR(data.monthlyTarget)}</span>
          <span className="font-semibold">{formatPct(data.targetProgressPct)}</span>
        </div>
        <div
          role="progressbar"
          aria-label="Progresso da receita face à meta mensal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <div className={cn('h-full rounded-full transition-[width] duration-700', onTrack ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-primary')} style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{onTrack ? 'Projeção acima da meta.' : `Faltam ${formatEUR(Math.max(0, data.monthlyTarget - data.monthToDate))} para a meta.`}</p>
      </div>
    </KpiCard>
  )
}

const statusStyles: Record<ProjectStatus, string> = {
  em_desenvolvimento: 'bg-chart-2',
  em_teste: 'bg-chart-3',
  entregue: 'bg-chart-4',
}

export function ProjectsCard({ data, delay }: { data: ProjectsKpi; delay?: number }) {
  const total = PROJECT_STATUSES.reduce((acc, s) => acc + data.byStatus[s], 0)

  return (
    <KpiCard title="Projetos ativos" icon={<Rocket className="size-4" />} delay={delay}>
      <div className="flex items-end gap-2">
        <p className="text-3xl font-black tabular-nums">{data.active}</p>
        <p className="pb-1 text-xs text-muted-foreground">de {total} no total</p>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        {PROJECT_STATUSES.map((s) => (
          <div key={s} className={statusStyles[s]} style={{ width: `${(data.byStatus[s] / Math.max(total, 1)) * 100}%` }} />
        ))}
      </div>
      <ul className="grid gap-1.5 text-sm">
        {PROJECT_STATUSES.map((s) => (
          <li key={s} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className={cn('size-2.5 rounded-full', statusStyles[s])} aria-hidden />
              {projectStatusLabels[s]}
            </span>
            <strong className="tabular-nums">{data.byStatus[s]}</strong>
          </li>
        ))}
      </ul>
    </KpiCard>
  )
}

