import type { CampaignDailyMetric } from '@/types/marketing'

export interface CampaignMetricsSummary {
  impressions: number
  clicks: number
  spend: number
  leadsCount: number
  /** % de impressões que resultaram em clique */
  ctrPct: number
  /** Custo por clique (€) */
  cpc: number
  /** Custo por mil impressões (€) */
  cpm: number
  /** Custo por lead (€) */
  cpl: number
  /** Retorno sobre o investimento (receita atribuída ÷ gasto); null quando não há receita atribuída para calcular */
  roas: number | null
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

/**
 * Agrega métricas diárias brutas (de uma ou várias campanhas, qualquer janela de datas) e calcula os
 * rácios em runtime — nunca guardados, para nunca dessincronizarem dos números brutos de origem
 * (mesmo princípio de `paymentProgress`, src/lib/finance/progress.ts).
 */
export function campaignMetricsSummary(rows: Pick<CampaignDailyMetric, 'impressions' | 'clicks' | 'spend' | 'leadsCount'>[], attributedRevenue?: number): CampaignMetricsSummary {
  const impressions = sum(rows.map((r) => r.impressions))
  const clicks = sum(rows.map((r) => r.clicks))
  const spend = sum(rows.map((r) => r.spend))
  const leadsCount = sum(rows.map((r) => r.leadsCount))
  return {
    impressions,
    clicks,
    spend,
    leadsCount,
    ctrPct: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    cpl: leadsCount > 0 ? spend / leadsCount : 0,
    roas: attributedRevenue === undefined ? null : spend > 0 ? attributedRevenue / spend : 0,
  }
}

/** Soma o gasto de campanhas desde uma data (ISO, inclusive) — usado para o CAC real do Pipeline (Fase 2). */
export function sumCampaignSpendSince(metrics: Pick<CampaignDailyMetric, 'date' | 'spend'>[], sinceIsoDate: string): number {
  const since = sinceIsoDate.slice(0, 10)
  return sum(metrics.filter((m) => m.date >= since).map((m) => m.spend))
}
