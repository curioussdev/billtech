import type { Metadata } from 'next'
import { ReportView } from '@/components/admin/business/report-view'
import { ReportTabs } from '@/components/admin/business/report-widgets'
import { DemoBanner } from '@/components/admin/dashboard/demo-banner'
import { businessNow, listLeads, listProjects } from '@/lib/admin/analytics'
import { buildReport, REPORT_PERIODS, type ReportPeriod } from '@/lib/admin/reports'

export const metadata: Metadata = { title: 'Relatórios' }

export default async function ReportsPage() {
  const [projects, leads] = await Promise.all([listProjects(), listLeads()])
  const now = businessNow()

  // Os três relatórios são gerados no servidor; as abas só alternam a vista
  const reports = Object.fromEntries(REPORT_PERIODS.map((p) => [p, <ReportView key={p} report={buildReport(p, projects, leads, now)} />])) as Record<ReportPeriod, React.ReactNode>

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Relatórios</h1>
        <p className="mt-1 text-muted-foreground">Resumo executivo, comparativos e previsão, gerados automaticamente a partir dos dados.</p>
      </div>
      <DemoBanner trafficIsLive={false} />
      <ReportTabs reports={reports} />
    </div>
  )
}
