import { ChartCard } from '@/components/admin/dashboard/chart-card'
import { formatInt } from '@/lib/admin/format'
import type { PageStat, SourceStat } from '@/types/analytics'

function Empty({ live }: { live: boolean }) {
  return (
    <p className="text-sm text-muted-foreground">
      {live ? 'Ainda não há visitas registadas. Assim que a landing receber tráfego, aparece aqui.' : 'Disponível quando o analytics estiver ligado.'}
    </p>
  )
}

/** Barras horizontais simples, com o valor em texto (não depende só da cor). */
function BarList({ items }: { items: { label: string; value: number; sub?: string }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium">{item.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              <strong className="text-foreground">{formatInt(item.value)}</strong>
              {item.sub ? ` · ${item.sub}` : ''}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="h-full rounded-full bg-chart-1" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function ActivityPanels({ topPages, sources, live }: { topPages: PageStat[]; sources: SourceStat[]; live: boolean }) {
  return (
    <section aria-label="Atividade da landing" className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Páginas mais vistas" description="Visualizações nos últimos 30 dias." delay={0.1}>
        {topPages.length === 0 ? <Empty live={live} /> : <BarList items={topPages.map((p) => ({ label: p.path, value: p.views, sub: `${formatInt(p.visitors)} visitantes` }))} />}
      </ChartCard>
      <ChartCard title="Origem do tráfego" description="De onde vêm os visitantes (30 dias)." delay={0.18}>
        {sources.length === 0 ? <Empty live={live} /> : <BarList items={sources.map((s) => ({ label: s.source, value: s.visitors }))} />}
      </ChartCard>
    </section>
  )
}
