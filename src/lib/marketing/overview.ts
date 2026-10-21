import 'server-only'
import { businessNow, listCampaignMetrics, listCampaigns, listLeads } from '@/lib/admin/analytics'
import { DAY_MS } from '@/lib/admin/business'
import type { Metric } from '@/lib/admin/reports'
import { campaignMetricsSummary } from '@/lib/marketing/metrics'
import type { TimeSeriesPoint } from '@/types/analytics'
import type { Campaign, CampaignDailyMetric, CampaignPlatform, CampaignStatus } from '@/types/marketing'

/**
 * Composição da vista do módulo de Marketing: investimento, impressões/cliques e a diferença entre
 * "Leads (Meta)" (o que a própria plataforma de anúncios reporta nos números brutos) e "Contactos
 * (CRM)" (o que realmente chegou a `leads` com atribuição de campanha) — a mesma distinção dos
 * screenshots de referência, porque nem todo lead reportado pela plataforma vira um contacto real no
 * CRM. Segue o padrão de `src/lib/crm/overview.ts`: uma função que agrega tudo, consumida por uma
 * página de servidor.
 */

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)
const change = (current: number, previous: number): number | null => (previous === 0 ? null : ((current - previous) / previous) * 100)
const metric = (value: number, previous: number): Metric => ({ value, previous, changePct: change(value, previous) })
const dateNDaysAgo = (now: Date, n: number) => new Date(now.getTime() - n * DAY_MS).toISOString().slice(0, 10)

export interface MarketingCampaignRow {
  id: string
  name: string
  platform: CampaignPlatform
  status: CampaignStatus
  spend: number
  impressions: number
  clicks: number
  leadsCount: number
  ctrPct: number
  cpl: number
  roas: number | null
}

export interface MarketingOverview {
  asOf: string
  windowDays: number
  spend: Metric
  impressions: Metric
  clicks: Metric
  ctrPct: Metric
  cpc: Metric
  cpm: Metric
  /** Leads reportados pelas próprias plataformas de anúncios (número bruto de `campaign_metrics.leads_count`) */
  platformLeads: Metric
  /** Custo por lead segundo a plataforma (spend ÷ platformLeads) */
  cpl: Metric
  /** Leads que realmente entraram no CRM com esta campanha atribuída (`leads.campaign_id`) */
  crmContacts: Metric
  /** Custo por lead real (spend ÷ crmContacts) — tende a ser mais alto que o CPL da plataforma */
  cplReal: Metric
  /** Negócios ganhos atribuídos a uma campanha, no período */
  adSales: Metric
  /** Receita atribuída ÷ gasto; null sem vendas atribuídas para calcular */
  roas: number | null
  dailySpend: TimeSeriesPoint[]
  dailyCplReal: TimeSeriesPoint[]
  campaigns: MarketingCampaignRow[]
}

function dailySeries(rows: CampaignDailyMetric[], from: string, to: string, value: (dayRows: CampaignDailyMetric[]) => number): TimeSeriesPoint[] {
  const byDate = new Map<string, CampaignDailyMetric[]>()
  for (const r of rows) byDate.set(r.date, [...(byDate.get(r.date) ?? []), r])

  const days: TimeSeriesPoint[] = []
  for (let d = new Date(`${from}T00:00:00.000Z`); d.toISOString().slice(0, 10) <= to; d = new Date(d.getTime() + DAY_MS)) {
    const key = d.toISOString().slice(0, 10)
    days.push({ date: key, value: value(byDate.get(key) ?? []) })
  }
  return days
}

export async function getMarketingOverview(windowDays = 30): Promise<MarketingOverview> {
  const [campaigns, allMetrics, leads] = await Promise.all([listCampaigns(), listCampaignMetrics(), listLeads()])
  const now = businessNow()
  const today = now.toISOString().slice(0, 10)
  const curStart = dateNDaysAgo(now, windowDays)
  const prevStart = dateNDaysAgo(now, windowDays * 2)

  const curRows = allMetrics.filter((m) => m.date > curStart && m.date <= today)
  const prevRows = allMetrics.filter((m) => m.date > prevStart && m.date <= curStart)
  const cur = campaignMetricsSummary(curRows)
  const prev = campaignMetricsSummary(prevRows)

  // Fronteiras em instante (não só a data) para os leads (timestamptz) caírem exatamente nos mesmos
  // dias de calendário que `curRows`/`prevRows` acima (DATE) — senão um lead à meia-noite do dia
  // `curStart` contaria como "atual" enquanto o gasto desse mesmo dia contaria como "anterior".
  const curStartTs = `${curStart}T00:00:00.000Z`
  const prevStartTs = `${prevStart}T00:00:00.000Z`
  const todayEndTs = `${today}T23:59:59.999Z`

  const attributedLeads = leads.filter((l) => l.campaignId)
  const crmContactsCur = attributedLeads.filter((l) => l.createdAt > curStartTs && l.createdAt <= todayEndTs).length
  const crmContactsPrev = attributedLeads.filter((l) => l.createdAt > prevStartTs && l.createdAt <= curStartTs).length

  const adSalesLeadsCur = attributedLeads.filter((l) => l.stage === 'ganho' && l.stageEnteredAt > curStartTs && l.stageEnteredAt <= todayEndTs)
  const adSalesLeadsPrev = attributedLeads.filter((l) => l.stage === 'ganho' && l.stageEnteredAt > prevStartTs && l.stageEnteredAt <= curStartTs)
  const attributedRevenueCur = sum(adSalesLeadsCur.map((l) => l.estimatedValue))

  const cplRealCur = crmContactsCur > 0 ? cur.spend / crmContactsCur : 0
  const cplRealPrev = crmContactsPrev > 0 ? prev.spend / crmContactsPrev : 0

  const campaignRows: MarketingCampaignRow[] = campaigns.map((c) => {
    const rows = curRows.filter((m) => m.campaignId === c.id)
    const s = campaignMetricsSummary(rows)
    const ownLeads = adSalesLeadsCur.filter((l) => l.campaignId === c.id)
    const revenue = sum(ownLeads.map((l) => l.estimatedValue))
    return { id: c.id, name: c.name, platform: c.platform, status: c.status, spend: s.spend, impressions: s.impressions, clicks: s.clicks, leadsCount: s.leadsCount, ctrPct: s.ctrPct, cpl: s.cpl, roas: s.spend > 0 ? revenue / s.spend : null }
  })

  return {
    asOf: now.toISOString(),
    windowDays,
    spend: metric(cur.spend, prev.spend),
    impressions: metric(cur.impressions, prev.impressions),
    clicks: metric(cur.clicks, prev.clicks),
    ctrPct: metric(cur.ctrPct, prev.ctrPct),
    cpc: metric(cur.cpc, prev.cpc),
    cpm: metric(cur.cpm, prev.cpm),
    platformLeads: metric(cur.leadsCount, prev.leadsCount),
    cpl: metric(cur.cpl, prev.cpl),
    crmContacts: metric(crmContactsCur, crmContactsPrev),
    cplReal: metric(cplRealCur, cplRealPrev),
    adSales: metric(adSalesLeadsCur.length, adSalesLeadsPrev.length),
    roas: cur.spend > 0 ? attributedRevenueCur / cur.spend : null,
    dailySpend: dailySeries(curRows, curStart, today, (rows) => sum(rows.map((r) => r.spend))),
    dailyCplReal: dailySeries(curRows, curStart, today, (rows) => {
      const daySpend = sum(rows.map((r) => r.spend))
      const dayLeads = sum(rows.map((r) => r.leadsCount))
      return dayLeads > 0 ? daySpend / dayLeads : 0
    }),
    campaigns: campaignRows,
  }
}
