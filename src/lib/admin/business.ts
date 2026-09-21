import { LEAD_CHANNELS, LEAD_STAGES, type Lead, type LeadChannel, type LeadStage } from '@/types/lead'
import { PROJECT_STATUSES, SECTORS, type ClientProject, type ProjectStatus, type Sector } from '@/types/project'

/** Lógica pura de negócio (sem I/O): receita, funil e prospeção. Testável e independente da fonte de dados. */

export const DAY_MS = 86_400_000
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)
const avg = (values: number[]) => (values.length ? sum(values) / values.length : 0)

// ─── Receita ────────────────────────────────────────────────────────────────

export const REVENUE_PERIODS = ['semana', 'mes', 'trimestre', 'ano', 'tudo'] as const
export type RevenuePeriod = (typeof REVENUE_PERIODS)[number]

export const periodLabels: Record<RevenuePeriod, string> = {
  semana: 'Últimos 7 dias',
  mes: 'Este mês',
  trimestre: 'Este trimestre',
  ano: 'Este ano (YTD)',
  tudo: 'Todo o histórico',
}

export type RevenueFilters = { periodo: RevenuePeriod; setor: Sector | 'todos'; estado: ProjectStatus | 'todos' }
export const DEFAULT_REVENUE_FILTERS: RevenueFilters = { periodo: 'ano', setor: 'todos', estado: 'todos' }

/** Lê os filtros do URL, ignorando valores inválidos. */
export function parseRevenueFilters(sp: Record<string, string | undefined>): RevenueFilters {
  return {
    periodo: (REVENUE_PERIODS as readonly string[]).includes(sp.periodo ?? '') ? (sp.periodo as RevenuePeriod) : DEFAULT_REVENUE_FILTERS.periodo,
    setor: (SECTORS as readonly string[]).includes(sp.setor ?? '') ? (sp.setor as Sector) : 'todos',
    estado: (PROJECT_STATUSES as readonly string[]).includes(sp.estado ?? '') ? (sp.estado as ProjectStatus) : 'todos',
  }
}

export function periodStart(period: RevenuePeriod, now: Date): Date | null {
  switch (period) {
    case 'semana':
      return new Date(now.getTime() - 7 * DAY_MS)
    case 'mes':
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    case 'trimestre':
      return new Date(Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3, 1))
    case 'ano':
      return new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
    default:
      return null
  }
}

export function filterProjects(projects: ClientProject[], filters: RevenueFilters, now: Date): ClientProject[] {
  const from = periodStart(filters.periodo, now)
  return projects.filter(
    (p) =>
      (!from || new Date(p.soldAt) >= from) &&
      new Date(p.soldAt) <= now &&
      (filters.setor === 'todos' || p.sector === filters.setor) &&
      (filters.estado === 'todos' || p.status === filters.estado),
  )
}

export function revenueSummary(projects: ClientProject[]) {
  const total = sum(projects.map((p) => p.value))
  const top = projects.reduce<ClientProject | null>((best, p) => (!best || p.value > best.value ? p : best), null)
  return {
    total,
    count: projects.length,
    avgTicket: projects.length ? total / projects.length : 0,
    top,
    // Ponderada pelo valor: um projeto grande pesa mais do que um pequeno
    avgMarginPct: total ? sum(projects.map((p) => p.value * p.marginPct)) / total : 0,
  }
}

export const SORT_KEYS = ['cliente', 'projeto', 'setor', 'valor', 'status', 'margem', 'data'] as const
export type SortKey = (typeof SORT_KEYS)[number]

export function sortProjects(projects: ClientProject[], key: SortKey, dir: 'asc' | 'desc'): ClientProject[] {
  const get: Record<SortKey, (p: ClientProject) => string | number> = {
    cliente: (p) => p.client.toLowerCase(),
    projeto: (p) => p.name.toLowerCase(),
    setor: (p) => p.sector,
    valor: (p) => p.value,
    status: (p) => p.status,
    margem: (p) => p.marginPct,
    data: (p) => p.soldAt,
  }
  const sign = dir === 'asc' ? 1 : -1
  return [...projects].sort((a, b) => {
    const x = get[key](a)
    const y = get[key](b)
    return (x < y ? -1 : x > y ? 1 : 0) * sign
  })
}

// ─── Funil de vendas ────────────────────────────────────────────────────────

export const OPEN_STAGES: LeadStage[] = ['captado', 'qualificado', 'proposta', 'negociacao']

export function daysInStage(lead: Lead, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(lead.stageEnteredAt).getTime()) / DAY_MS))
}

export function funnelMetrics(leads: Lead[], projects: ClientProject[], acquisitionSpend: number) {
  const won = leads.filter((l) => l.stage === 'ganho').length

  // LTV = lucro bruto médio por cliente ao longo da relação (valor × margem, somado por cliente)
  const grossByClient = new Map<string, number>()
  for (const p of projects) grossByClient.set(p.client, (grossByClient.get(p.client) ?? 0) + (p.value * p.marginPct) / 100)

  const byStage = Object.fromEntries(
    LEAD_STAGES.map((stage) => {
      const inStage = leads.filter((l) => l.stage === stage)
      return [stage, { count: inStage.length, value: sum(inStage.map((l) => l.estimatedValue)) }]
    }),
  ) as Record<LeadStage, { count: number; value: number }>

  return {
    totalLeads: leads.length,
    conversionPct: leads.length ? (won / leads.length) * 100 : 0,
    cac: won ? acquisitionSpend / won : 0,
    ltv: avg([...grossByClient.values()]),
    pipelineValue: sum(leads.filter((l) => OPEN_STAGES.includes(l.stage)).map((l) => l.estimatedValue)),
    byStage,
  }
}

// ─── Prospeção ──────────────────────────────────────────────────────────────

export function prospectingMetrics(leads: Lead[]) {
  const open = leads.filter((l) => OPEN_STAGES.includes(l.stage))
  const responded = leads.filter((l) => l.firstResponseHours !== null).map((l) => l.firstResponseHours as number)

  return {
    byChannel: LEAD_CHANNELS.map((channel: LeadChannel) => ({ channel, leads: leads.filter((l) => l.channel === channel).length })),
    avgResponseHours: avg(responded),
    followUpRatePct: open.length ? (open.filter((l) => l.followUps > 0).length / open.length) * 100 : 0,
    unansweredCount: leads.filter((l) => OPEN_STAGES.includes(l.stage) && l.firstResponseHours === null).length,
  }
}
