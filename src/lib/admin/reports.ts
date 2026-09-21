import { DAY_MS } from '@/lib/admin/business'
import { formatEUR, formatPct, sectorLabels } from '@/lib/admin/format'
import type { Lead } from '@/types/lead'
import { SECTORS, type ClientProject, type Sector } from '@/types/project'

export const REPORT_PERIODS = ['semanal', 'mensal', 'anual'] as const
export type ReportPeriod = (typeof REPORT_PERIODS)[number]

const WINDOW_DAYS: Record<ReportPeriod, number> = { semanal: 7, mensal: 30, anual: 365 }
const REPORT_LABELS: Record<ReportPeriod, { title: string; range: string; next: string }> = {
  semanal: { title: 'Relatório semanal', range: 'últimos 7 dias', next: 'Próximos 7 dias' },
  mensal: { title: 'Relatório mensal', range: 'últimos 30 dias', next: 'Próximos 30 dias' },
  anual: { title: 'Relatório anual', range: 'últimos 12 meses', next: 'Próximos 12 meses' },
}

export type Metric = { value: number; previous: number; /** null quando o período anterior não tem dados */ changePct: number | null }

export interface ReportData {
  period: ReportPeriod
  title: string
  rangeLabel: string
  from: string
  to: string
  revenue: Metric
  projectsSold: Metric
  newLeads: Metric
  /** Taxa de fecho: ganhos / (ganhos + perdidos) decididos no período */
  closeRatePct: Metric
  topProjects: ClientProject[]
  topSectors: { sector: Sector; demand: number; leads: number; projects: number; revenue: number }[]
  forecast: { label: string; value: number; method: string }
  /** Resumo executivo: parágrafos gerados a partir dos números acima */
  summary: string[]
}

type Window = { from: number; to: number } // (from, to]
const inWindow = (iso: string, w: Window) => {
  const t = new Date(iso).getTime()
  return t > w.from && t <= w.to
}

const windowAt = (now: Date, length: number, back: number): Window => ({ from: now.getTime() - (back + 1) * length * DAY_MS, to: now.getTime() - back * length * DAY_MS })
const sum = (v: number[]) => v.reduce((a, b) => a + b, 0)
const change = (current: number, previous: number): number | null => (previous === 0 ? null : ((current - previous) / previous) * 100)
const metric = (value: number, previous: number): Metric => ({ value, previous, changePct: change(value, previous) })

function windowStats(projects: ClientProject[], leads: Lead[], w: Window) {
  const sold = projects.filter((p) => inWindow(p.soldAt, w))
  const won = leads.filter((l) => l.stage === 'ganho' && inWindow(l.stageEnteredAt, w)).length
  const lost = leads.filter((l) => l.stage === 'perdido' && inWindow(l.stageEnteredAt, w)).length
  return {
    sold,
    revenue: sum(sold.map((p) => p.value)),
    newLeads: leads.filter((l) => inWindow(l.createdAt, w)),
    closeRate: won + lost ? (won / (won + lost)) * 100 : 0,
    won,
    lost,
  }
}

const trend = (m: Metric, unit: string) =>
  m.changePct === null ? '' : ` (${m.changePct >= 0 ? '↑' : '↓'} ${formatPct(Math.abs(m.changePct))} face ${unit})`

export function buildReport(period: ReportPeriod, projects: ClientProject[], leads: Lead[], now: Date): ReportData {
  const length = WINDOW_DAYS[period]
  const labels = REPORT_LABELS[period]
  const cur = windowAt(now, length, 0)
  const prev = windowAt(now, length, 1)
  const c = windowStats(projects, leads, cur)
  const p = windowStats(projects, leads, prev)

  const revenue = metric(c.revenue, p.revenue)
  const projectsSold = metric(c.sold.length, p.sold.length)
  const newLeads = metric(c.newLeads.length, p.newLeads.length)
  const closeRatePct = metric(c.closeRate, p.closeRate)

  const topProjects = [...c.sold].sort((a, b) => b.value - a.value).slice(0, 3)

  // Demanda por setor = leads novos + projetos vendidos no período
  const topSectors = SECTORS.map((sector) => {
    const secProjects = c.sold.filter((x) => x.sector === sector)
    const secLeads = c.newLeads.filter((l) => l.sector === sector).length
    return { sector, demand: secLeads + secProjects.length, leads: secLeads, projects: secProjects.length, revenue: sum(secProjects.map((x) => x.value)) }
  })
    .filter((s) => s.demand > 0)
    .sort((a, b) => b.demand - a.demand || b.revenue - a.revenue)
    .slice(0, 3)

  // Previsão: tendência linear simples sobre 3 janelas consecutivas (anual: ritmo dos últimos 6 meses)
  let forecast: ReportData['forecast']
  if (period === 'anual') {
    const months = Array.from({ length: 6 }, (_, i) => windowStats(projects, leads, windowAt(now, 30, i)).revenue)
    forecast = { label: labels.next, value: Math.round((sum(months) / 6) * 12), method: 'Média mensal dos últimos 6 meses × 12' }
  } else {
    const v1 = windowStats(projects, leads, windowAt(now, length, 2)).revenue
    const slope = (c.revenue - v1) / 2
    forecast = { label: labels.next, value: Math.max(0, Math.round(c.revenue + slope)), method: 'Tendência linear simples sobre os últimos 3 períodos' }
  }

  const unit = period === 'semanal' ? 'à semana anterior' : period === 'mensal' ? 'ao mês anterior' : 'ao ano anterior'
  const summary: string[] = []
  summary.push(
    c.sold.length
      ? `Nos ${labels.range}, a BillTech faturou ${formatEUR(revenue.value)}${trend(revenue, unit)} com ${c.sold.length} ${c.sold.length === 1 ? 'projeto vendido' : 'projetos vendidos'}, num ticket médio de ${formatEUR(revenue.value / c.sold.length)}.`
      : `Nos ${labels.range} não foram registadas vendas de projetos${p.revenue ? `, face a ${formatEUR(p.revenue)} no período anterior` : ''}.`,
  )
  summary.push(
    `${c.newLeads.length === 1 ? 'Entrou 1 novo lead' : `Entraram ${c.newLeads.length} novos leads`}${trend(newLeads, unit)}; ${c.won === 1 ? '1 negócio ganho' : `${c.won} negócios ganhos`} e ${c.lost === 1 ? '1 perdido' : `${c.lost} perdidos`}${c.won + c.lost ? ` (taxa de fecho de ${formatPct(c.closeRate)})` : ''}.`,
  )
  if (topSectors[0]) summary.push(`${sectorLabels[topSectors[0].sector]} é o setor com mais procura (${topSectors[0].demand} ${topSectors[0].demand === 1 ? 'oportunidade' : 'oportunidades'}), seguido de ${topSectors[1] ? sectorLabels[topSectors[1].sector] : 'nenhum outro setor com atividade'}.`)
  summary.push(`Se o ritmo atual se mantiver, a projeção de receita para os ${labels.next.toLowerCase()} é de ${formatEUR(forecast.value)} (${forecast.method.toLowerCase()}).`)

  return {
    period,
    title: labels.title,
    rangeLabel: labels.range,
    from: new Date(cur.from).toISOString(),
    to: new Date(cur.to).toISOString(),
    revenue,
    projectsSold,
    newLeads,
    closeRatePct,
    topProjects,
    topSectors,
    forecast,
    summary,
  }
}
