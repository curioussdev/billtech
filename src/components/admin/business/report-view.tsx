import { ChangeBadge } from '@/components/admin/dashboard/kpi-card'
import { PdfButton } from '@/components/admin/business/report-widgets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEUR, formatInt, formatPct, sectorLabels } from '@/lib/admin/format'
import type { Metric, ReportData } from '@/lib/admin/reports'

const date = (iso: string) => new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

function Change({ metric }: { metric: Metric }) {
  return metric.changePct === null ? <span className="text-xs text-muted-foreground">sem período anterior</span> : <ChangeBadge value={metric.changePct} />
}

export function ReportView({ report }: { report: ReportData }) {
  const rows: { label: string; metric: Metric; format: (n: number) => string }[] = [
    { label: 'Receita', metric: report.revenue, format: formatEUR },
    { label: 'Projetos vendidos', metric: report.projectsSold, format: formatInt },
    { label: 'Novos leads', metric: report.newLeads, format: formatInt },
    { label: 'Taxa de fecho', metric: report.closeRatePct, format: (n) => formatPct(n) },
  ]

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{report.title}</h2>
          <p className="text-sm text-muted-foreground">
            {date(report.from)} — {date(report.to)} ({report.rangeLabel})
          </p>
        </div>
        <PdfButton period={report.period} />
      </header>

      <section aria-labelledby={`resumo-${report.period}`} className="rounded-2xl border border-border bg-card p-6">
        <h3 id={`resumo-${report.period}`} className="mb-3 text-lg font-bold">
          Resumo executivo
        </h3>
        <div className="grid max-w-3xl gap-3 leading-7">
          {report.summary.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((r) => (
          <Card key={r.label}>
            <CardContent className="grid gap-2">
              <p className="text-sm font-medium text-muted-foreground">{r.label}</p>
              <p className="text-2xl font-black tabular-nums">{r.format(r.metric.value)}</p>
              <Change metric={r.metric} />
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 3 projetos por receita</CardTitle>
          </CardHeader>
          <CardContent>
            {report.topProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem projetos vendidos neste período.</p>
            ) : (
              <ol className="grid gap-3">
                {report.topProjects.map((p, i) => (
                  <li key={p.id} className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary" aria-hidden>
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.client}</span>
                      <span className="block truncate text-xs text-muted-foreground">{p.name}</span>
                    </span>
                    <strong className="tabular-nums">{formatEUR(p.value)}</strong>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 3 setores por demanda</CardTitle>
          </CardHeader>
          <CardContent>
            {report.topSectors.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem atividade neste período.</p>
            ) : (
              <ol className="grid gap-3">
                {report.topSectors.map((s, i) => (
                  <li key={s.sector} className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary" aria-hidden>
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{sectorLabels[s.sector]}</span>
                      <span className="block text-xs text-muted-foreground">
                        {s.leads} leads · {s.projects} projetos · {formatEUR(s.revenue)}
                      </span>
                    </span>
                    <strong className="tabular-nums" title="Leads novos + projetos vendidos">
                      {s.demand}
                    </strong>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby={`comparativo-${report.period}`} className="overflow-x-auto rounded-2xl border border-border bg-card">
          <h3 id={`comparativo-${report.period}`} className="px-5 pt-5 text-base font-bold">
            Comparativo com o período anterior
          </h3>
          <table className="mt-3 w-full min-w-[420px] text-left text-sm">
            <thead className="border-y border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-2.5">Indicador</th>
                <th scope="col" className="px-5 py-2.5 text-right">Atual</th>
                <th scope="col" className="px-5 py-2.5 text-right">Anterior</th>
                <th scope="col" className="px-5 py-2.5 text-right">Variação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row" className="px-5 py-3 font-medium">{r.label}</th>
                  <td className="px-5 py-3 text-right tabular-nums">{r.format(r.metric.value)}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{r.format(r.metric.previous)}</td>
                  <td className="px-5 py-3 text-right">
                    <Change metric={r.metric} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previsão · {report.forecast.label}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <p className="text-3xl font-black tabular-nums">{formatEUR(report.forecast.value)}</p>
            <p className="text-xs text-muted-foreground">{report.forecast.method}. É uma estimativa simples, não uma garantia.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
