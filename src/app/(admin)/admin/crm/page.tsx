import type { Metadata } from 'next'
import Link from 'next/link'
import { NotebookText, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChartCard } from '@/components/admin/dashboard/chart-card'
import {
  ColdCallsPaceCard,
  ColdCallsWeekCard,
  MeetingsTodayCard,
  MeetingsWeekCard,
  PipelineCard,
  ProposalsWeekCard,
  RevenueMonthCard,
  WinRateCard,
} from '@/components/admin/crm/kpi-cards'
import { LossReasonsDonut, ProspectingLineChart, RevenueByNicheChart, SalesFunnelChart } from '@/components/admin/crm/charts'
import { YearlyGoalCard } from '@/components/admin/crm/yearly-goal-card'
import { getCrmOverview } from '@/lib/crm/overview'

export const metadata: Metadata = { title: 'Escritório Virtual' }

export default async function CrmPage() {
  const overview = await getCrmOverview()

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Escritório Virtual</h1>
          <p className="mt-1 text-muted-foreground">Centro de comando de vendas: leads, follow-up, cold calls e metas, num só lugar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/admin/crm/metas" />} nativeButton={false} variant="outline" size="sm">
            <Target className="size-4" aria-hidden />
            Metas
          </Button>
          <Button render={<Link href="/admin/crm/interacoes" />} nativeButton={false} variant="outline" size="sm">
            <NotebookText className="size-4" aria-hidden />
            Histórico de interações
          </Button>
        </div>
      </div>

      <YearlyGoalCard data={overview.yearlyGoal} asOf={overview.asOf} />

      <section aria-labelledby="metas-diarias" className="grid gap-4">
        <h2 id="metas-diarias" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Metas diárias
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColdCallsPaceCard data={overview.coldCallsToday} delay={0} />
          <MeetingsTodayCard data={overview.meetingsToday} delay={0.06} />
        </div>
      </section>

      <section aria-labelledby="metas-semanais" className="grid gap-4">
        <h2 id="metas-semanais" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Metas semanais
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ColdCallsWeekCard data={overview.coldCallsWeek} delay={0} />
          <MeetingsWeekCard data={overview.meetingsWeek} delay={0.06} />
          <ProposalsWeekCard data={overview.proposalsWeek} delay={0.12} />
        </div>
      </section>

      <section aria-labelledby="metas-mensais" className="grid gap-4">
        <h2 id="metas-mensais" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Metas mensais
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <RevenueMonthCard data={overview.revenueMonth} delay={0} />
          <WinRateCard data={overview.winRate} delay={0.06} />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PipelineCard data={overview.pipeline} />
      </div>

      <section aria-label="Gráficos" className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Prospecções vs. Fechamentos" description="Cold calls realizadas e negócios ganhos, últimos 30 dias." delay={0.1}>
          <ProspectingLineChart data={overview.dailySeries} />
        </ChartCard>
        <ChartCard title="Funil de Vendas" description="Do lead gerado ao negócio fechado, com a conversão entre etapas." delay={0.16}>
          <SalesFunnelChart stages={overview.funnel} />
        </ChartCard>
        <ChartCard title="Motivos de Perda" description="Porque é que os negócios perdidos não avançaram." delay={0.22}>
          <LossReasonsDonut data={overview.lossReasons} />
        </ChartCard>
        <ChartCard title="Receita por Nicho" description="Negócios ganhos, por setor de atividade." delay={0.28}>
          <RevenueByNicheChart data={overview.revenueBySector} />
        </ChartCard>
      </section>
    </div>
  )
}
