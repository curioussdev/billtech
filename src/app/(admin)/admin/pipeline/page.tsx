import type { Metadata } from 'next'
import { ComercialMoneyCard } from '@/components/admin/business/comercial-money-card'
import { PipelineBoard } from '@/components/admin/business/pipeline-board'
import { NewLeadModal } from '@/components/admin/crm/new-lead-modal'
import { businessNow, listCampaignMetrics, listCampaigns, listInteractions, listLeads, listProjects } from '@/lib/admin/analytics'
import { DAY_MS, funnelMetrics, latestNextStepByLead } from '@/lib/admin/business'
import { listAllInvoices, listPortalClients } from '@/lib/finance/admin-queries'
import { sumCampaignSpendSince } from '@/lib/marketing/metrics'
import { paymentProgress } from '@/lib/finance/progress'

export const metadata: Metadata = { title: 'Pipeline de Vendas' }

export default async function PipelinePage() {
  const [leads, projects, interactions, portalClients, campaignMetrics, campaigns, invoices] = await Promise.all([
    listLeads(),
    listProjects(),
    listInteractions(),
    listPortalClients(),
    listCampaignMetrics(),
    listCampaigns(),
    listAllInvoices(),
  ])
  const now = businessNow()
  // Gasto real em campanhas nos últimos 90 dias (antes: um valor fixo inventado, ACQUISITION_SPEND_90D) — ver supabase/029_marketing.sql
  const acquisitionSpend = sumCampaignSpendSince(campaignMetrics, new Date(now.getTime() - 90 * DAY_MS).toISOString())
  // O LTV vem do histórico de projetos (não muda ao arrastar leads)
  const { ltv } = funnelMetrics(leads, projects, acquisitionSpend)
  const nextSteps = latestNextStepByLead(interactions)

  // "Dinheiro do Comercial": negócios ganhos com fatura associada, cobrado vs por cobrar — vem sempre
  // do livro-razão do Financeiro (paymentProgress), nunca de um cálculo paralelo.
  const wonInvoiceIds = new Set(leads.filter((l) => l.stage === 'ganho' && l.invoiceId).map((l) => l.invoiceId))
  const wonInvoices = invoices.filter((inv) => wonInvoiceIds.has(inv.id))
  const progresses = wonInvoices.map((inv) => paymentProgress(inv))
  const collected = progresses.reduce((sum, p) => sum + p.paidAmount, 0)
  const outstanding = progresses.reduce((sum, p) => sum + p.remainingAmount, 0)

  return (
    <div className="mx-auto grid max-w-[1600px] gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Pipeline de Vendas</h1>
          <p className="mt-1 text-muted-foreground">Funil B2B do lead captado ao negócio ganho ou perdido.</p>
        </div>
        <NewLeadModal campaigns={campaigns} />
      </div>
      <ComercialMoneyCard collected={collected} outstanding={outstanding} wonInvoiced={wonInvoices.length} />
      <PipelineBoard
        initialLeads={leads}
        nowIso={businessNow().toISOString()}
        ltv={ltv}
        acquisitionSpend={acquisitionSpend}
        nextSteps={nextSteps}
        portalClients={portalClients.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  )
}
