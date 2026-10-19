import type { Metadata } from 'next'
import { PipelineBoard } from '@/components/admin/business/pipeline-board'
import { NewLeadModal } from '@/components/admin/crm/new-lead-modal'
import { ACQUISITION_SPEND_90D } from '@/data/mock/dashboard'
import { businessNow, listInteractions, listLeads, listProjects } from '@/lib/admin/analytics'
import { funnelMetrics, latestNextStepByLead } from '@/lib/admin/business'
import { listPortalClients } from '@/lib/finance/admin-queries'

export const metadata: Metadata = { title: 'Pipeline de Vendas' }

export default async function PipelinePage() {
  const [leads, projects, interactions, portalClients] = await Promise.all([listLeads(), listProjects(), listInteractions(), listPortalClients()])
  // O LTV vem do histórico de projetos (não muda ao arrastar leads)
  const { ltv } = funnelMetrics(leads, projects, ACQUISITION_SPEND_90D)
  const nextSteps = latestNextStepByLead(interactions)

  return (
    <div className="mx-auto grid max-w-[1600px] gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Pipeline de Vendas</h1>
          <p className="mt-1 text-muted-foreground">Funil B2B do lead captado ao negócio ganho ou perdido.</p>
        </div>
        <NewLeadModal />
      </div>
      <PipelineBoard
        initialLeads={leads}
        nowIso={businessNow().toISOString()}
        ltv={ltv}
        acquisitionSpend={ACQUISITION_SPEND_90D}
        nextSteps={nextSteps}
        portalClients={portalClients.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  )
}
