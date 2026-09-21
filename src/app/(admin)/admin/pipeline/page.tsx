import type { Metadata } from 'next'
import { PipelineBoard } from '@/components/admin/business/pipeline-board'
import { DemoBanner } from '@/components/admin/dashboard/demo-banner'
import { ACQUISITION_SPEND_90D } from '@/data/mock/dashboard'
import { businessNow, listLeads, listProjects } from '@/lib/admin/analytics'
import { funnelMetrics } from '@/lib/admin/business'

export const metadata: Metadata = { title: 'Pipeline de Vendas' }

export default async function PipelinePage() {
  const [leads, projects] = await Promise.all([listLeads(), listProjects()])
  // O LTV vem do histórico de projetos (não muda ao arrastar leads)
  const { ltv } = funnelMetrics(leads, projects, ACQUISITION_SPEND_90D)

  return (
    <div className="mx-auto grid max-w-[1600px] gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Pipeline de Vendas</h1>
        <p className="mt-1 text-muted-foreground">Funil B2B do lead captado ao negócio ganho ou perdido.</p>
      </div>
      <DemoBanner trafficIsLive={false} />
      <PipelineBoard initialLeads={leads} nowIso={businessNow().toISOString()} ltv={ltv} acquisitionSpend={ACQUISITION_SPEND_90D} />
    </div>
  )
}
