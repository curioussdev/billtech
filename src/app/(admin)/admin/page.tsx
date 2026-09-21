import type { Metadata } from 'next'
import { ChartCard } from '@/components/admin/dashboard/chart-card'
import { RevenueLineChart, SectorBarChart } from '@/components/admin/dashboard/charts'
import { ActivityPanels } from '@/components/admin/dashboard/activity-panels'
import { DemoBanner } from '@/components/admin/dashboard/demo-banner'
import { ProjectsCard, RevenueCard, TrafficCard } from '@/components/admin/dashboard/kpi-cards'
import { RealtimeUsersCard } from '@/components/admin/dashboard/realtime-users-card'
import { getDashboardOverview } from '@/lib/admin/analytics'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function AdminHomePage() {
  const overview = await getDashboardOverview()

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Visão executiva</h1>
        <p className="mt-1 text-muted-foreground">Tráfego, receita e projetos da BillTech num só lugar.</p>
      </div>

      <DemoBanner trafficIsLive={overview.trafficIsLive} />

      <section aria-label="Indicadores principais" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TrafficCard data={overview.traffic} delay={0} />
        <RealtimeUsersCard initial={overview.realtime} delay={0.06} />
        <RevenueCard data={overview.revenue} delay={0.12} />
        <ProjectsCard data={overview.projects} delay={0.18} />
      </section>

      <section aria-label="Gráficos" className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Receita dos últimos 6 meses" description="Faturação por mês de venda; a linha tracejada é a projeção de fecho do mês corrente." delay={0.1}>
          <RevenueLineChart data={overview.revenueHistory} />
        </ChartCard>
        <ChartCard title="Projetos entregues por setor" description="Número de projetos concluídos em cada setor de atuação." delay={0.18}>
          <SectorBarChart data={overview.deliveredBySector} />
        </ChartCard>
      </section>

      <ActivityPanels topPages={overview.topPages} sources={overview.sources} live={overview.trafficIsLive} />
    </div>
  )
}
