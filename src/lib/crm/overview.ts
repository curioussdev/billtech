import 'server-only'
import { businessNow, listGoals, listInteractions, listLeads } from '@/lib/admin/analytics'
import { sectorLabels } from '@/lib/admin/format'
import { buildReport } from '@/lib/admin/reports'
import { funnelMetrics, OPEN_STAGES } from '@/lib/admin/business'
import { calculatePace, projectYearlyRevenue } from '@/lib/crm/analytics'
import { lossReasonLabels } from '@/lib/crm/labels'
import type { GoalMetric, GoalPeriodType, LossReason } from '@/types/crm'

/**
 * Composição da vista do "Escritório Virtual" (dashboard do CRM). Reaproveita o que já existe:
 * `funnelMetrics` (Pipeline), `buildReport` (Relatórios, para o Win Rate) e os helpers puros de
 * `lib/crm/analytics.ts` — em vez de recalcular tudo de raiz para este ecrã.
 */

export interface CrmDailyPoint {
  date: string
  coldCalls: number
  closings: number
}

export interface CrmFunnelStage {
  label: string
  value: number
}

export interface CrmLossSlice {
  reason: LossReason
  label: string
  count: number
}

export interface CrmSectorRevenue {
  sector: string
  label: string
  value: number
}

export interface CrmOverview {
  asOf: string
  revenueMonth: { current: number; target: number; progressPct: number }
  winRate: { value: number; changePct: number | null; won: number; decided: number }
  coldCallsToday: { current: number; target: number; pacePct: number }
  meetingsToday: { current: number; target: number }
  pipeline: { value: number; openCount: number; qualifying: number; finalNegotiation: number }
  dailySeries: CrmDailyPoint[]
  funnel: CrmFunnelStage[]
  lossReasons: CrmLossSlice[]
  revenueBySector: CrmSectorRevenue[]
  yearlyGoal: { current: number; target: number; progressPct: number; projected: number; onPace: boolean }
}

export async function getCrmOverview(): Promise<CrmOverview> {
  const [leads, interactions, goals] = await Promise.all([listLeads(), listInteractions(), listGoals()])
  const now = businessNow()
  const todayKey = now.toISOString().slice(0, 10)
  const monthKey = now.toISOString().slice(0, 7)
  const yearKey = String(now.getUTCFullYear())

  const goalTarget = (periodType: GoalPeriodType, metric: GoalMetric, period: string, fallback: number) =>
    goals.find((g) => g.periodType === periodType && g.metric === metric && g.period === period)?.target ?? fallback

  const won = leads.filter((l) => l.stage === 'ganho')

  // Receita do mês: negócios ganhos cuja entrada em "ganho" caiu neste mês
  const wonThisMonth = won.filter((l) => l.stageEnteredAt.startsWith(monthKey))
  const revenueMonthCurrent = wonThisMonth.reduce((sum, l) => sum + l.estimatedValue, 0)
  const revenueMonthTarget = goalTarget('mensal', 'revenue', monthKey, 20_000)

  // Win Rate: reaproveita o relatório mensal (últimos 30 dias) já testado em /admin/reports
  const report = buildReport('mensal', [], leads, now)

  // Cold calls e reuniões de hoje
  const coldCallsToday = interactions.filter((i) => i.type === 'cold_call' && i.occurredAt.startsWith(todayKey)).length
  const meetingsToday = interactions.filter((i) => i.occurredAt.startsWith(todayKey) && i.outcome === 'agendado').length
  const coldCallsTarget = goalTarget('diaria', 'cold_calls', todayKey, 50)
  const meetingsTarget = goalTarget('diaria', 'meetings', todayKey, 2)

  // Pipeline (reaproveita funnelMetrics; acquisitionSpend=0 porque não usamos CAC/LTV aqui)
  const funnel = funnelMetrics(leads, [], 0)
  const qualifying = funnel.byStage.captado.count + funnel.byStage.qualificado.count
  const finalNegotiation = funnel.byStage.proposta.count + funnel.byStage.negociacao.count

  // Série diária (30 dias): cold calls realizadas vs fechamentos ganhos
  const dailySeries: CrmDailyPoint[] = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(now.getTime() - (29 - i) * 86_400_000).toISOString().slice(0, 10)
    return {
      date: day,
      coldCalls: interactions.filter((x) => x.type === 'cold_call' && x.occurredAt.startsWith(day)).length,
      closings: won.filter((l) => l.stageEnteredAt.startsWith(day)).length,
    }
  })

  // Funil de vendas (contagens cumulativas ao longo do processo de venda)
  const contacted = leads.filter((l) => l.firstResponseHours !== null || l.stage !== 'captado').length
  const scheduled = leads.filter((l) => interactions.some((i) => i.leadId === l.id && (i.outcome === 'agendado' || i.outcome === 'sucesso'))).length
  const proposed = leads.filter((l) => l.stage === 'proposta' || l.stage === 'negociacao' || l.stage === 'ganho' || l.stage === 'perdido').length
  const funnelStages: CrmFunnelStage[] = [
    { label: 'Leads Gerados', value: leads.length },
    { label: 'Contatados', value: contacted },
    { label: 'Reuniões Agendadas', value: scheduled },
    { label: 'Propostas Enviadas', value: proposed },
    { label: 'Fechados', value: won.length },
  ]

  // Motivos de perda
  const lossCounts = new Map<LossReason, number>()
  for (const l of leads) if (l.stage === 'perdido' && l.lossReason) lossCounts.set(l.lossReason, (lossCounts.get(l.lossReason) ?? 0) + 1)
  const lossReasons: CrmLossSlice[] = [...lossCounts.entries()].map(([reason, count]) => ({ reason, label: lossReasonLabels[reason], count })).sort((a, b) => b.count - a.count)

  // Receita por nicho (negócios ganhos)
  const bySector = new Map<string, number>()
  for (const l of won) bySector.set(l.sector, (bySector.get(l.sector) ?? 0) + l.estimatedValue)
  const revenueBySector: CrmSectorRevenue[] = [...bySector.entries()]
    .map(([sector, value]) => ({ sector, label: sectorLabels[sector as keyof typeof sectorLabels], value }))
    .sort((a, b) => b.value - a.value)

  // Meta anual
  const yearlyTarget = goalTarget('anual', 'revenue', yearKey, 240_000)
  const yearlyCurrent = won.reduce((sum, l) => sum + l.estimatedValue, 0)
  const monthsElapsed = now.getUTCMonth() + 1
  const projected = projectYearlyRevenue(yearlyCurrent, monthsElapsed)

  return {
    asOf: now.toISOString(),
    revenueMonth: { current: revenueMonthCurrent, target: revenueMonthTarget, progressPct: calculatePace(revenueMonthCurrent, revenueMonthTarget) },
    winRate: { value: report.closeRatePct.value, changePct: report.closeRatePct.changePct, won: report.dealsWon.value, decided: report.dealsWon.value + report.dealsLost.value },
    coldCallsToday: { current: coldCallsToday, target: coldCallsTarget, pacePct: calculatePace(coldCallsToday, coldCallsTarget) },
    meetingsToday: { current: meetingsToday, target: meetingsTarget },
    pipeline: { value: funnel.pipelineValue, openCount: OPEN_STAGES.reduce((sum, stage) => sum + funnel.byStage[stage].count, 0), qualifying, finalNegotiation },
    dailySeries,
    funnel: funnelStages,
    lossReasons,
    revenueBySector,
    yearlyGoal: { current: yearlyCurrent, target: yearlyTarget, progressPct: calculatePace(yearlyCurrent, yearlyTarget), projected, onPace: projected >= yearlyTarget },
  }
}
