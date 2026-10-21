import { mockDailyVisits, mockRealtime } from '@/data/mock/dashboard'
import { mockGoals, mockInteractions } from '@/data/mock/crm'
import { mockLeads, mockMeetings } from '@/data/mock/leads'
import { mockProjects } from '@/data/mock/projects'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createAdminClient } from '@/lib/supabase/server'
import type { DashboardOverview, MonthlyRevenuePoint, OnlinePage, PageStat, RealtimeUsers, SourceStat, TimeSeriesPoint } from '@/types/analytics'
import type { DealProjectType, Goal, Interaction, LossReason } from '@/types/crm'
import type { Lead, Meeting } from '@/types/lead'
import { PROJECT_STATUSES, SECTORS, type ClientProject, type ProjectStatus } from '@/types/project'

type InteractionRow = {
  id: string
  lead_id: string
  lead_label: string
  type: Interaction['type']
  occurred_at: string
  duration_min: number | null
  outcome: Interaction['outcome']
  notes: string
  next_step: string
  created_at: string
}

/** Follow-up e cold calls: lê a tabela real `interactions`; sem base de dados, cai nos dados de demonstração. */
export async function listInteractions(): Promise<Interaction[]> {
  if (!isLive()) return mockInteractions
  try {
    const { data, error } = await createAdminClient().from('interactions').select('*').order('occurred_at', { ascending: false })
    if (error) throw error
    return (data as InteractionRow[]).map((r) => ({
      id: r.id,
      leadId: r.lead_id,
      leadLabel: r.lead_label,
      type: r.type,
      occurredAt: r.occurred_at,
      durationMin: r.duration_min,
      outcome: r.outcome,
      notes: r.notes,
      nextStep: r.next_step,
      createdAt: r.created_at,
    }))
  } catch (error) {
    console.error('[crm] leitura de interactions falhou; a usar dados de demonstração:', error)
    return mockInteractions
  }
}

type GoalRow = { id: string; period_type: Goal['periodType']; metric: Goal['metric']; target: number; period: string; created_at: string; updated_at: string }

/** Metas: lê a tabela real `goals`; sem base de dados, cai nos dados de demonstração. */
export async function listGoals(): Promise<Goal[]> {
  if (!isLive()) return mockGoals
  try {
    const { data, error } = await createAdminClient().from('goals').select('*')
    if (error) throw error
    return (data as GoalRow[]).map((r) => ({ id: r.id, periodType: r.period_type, metric: r.metric, target: r.target, period: r.period, createdAt: r.created_at, updatedAt: r.updated_at }))
  } catch (error) {
    console.error('[crm] leitura de goals falhou; a usar dados de demonstração:', error)
    return mockGoals
  }
}

type LeadRow = {
  id: string
  contact_name: string
  company: string
  sector: Lead['sector']
  estimated_value: number
  stage: Lead['stage']
  channel: Lead['channel']
  stage_entered_at: string
  created_at: string
  owner: string
  follow_ups: number
  first_response_hours: number | null
  project_name: string | null
  project_type: DealProjectType | null
  loss_reason: LossReason | null
  client_id: string | null
}

const isLive = () => isSupabaseConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

/**
 * CAMADA DE DADOS DO ADMIN.
 * Hoje lê dos mocks em `src/data/mock/`; para ligar ao PostgreSQL basta reescrever estas
 * funções (ex.: com Prisma) mantendo as assinaturas e os tipos de `src/types/`.
 */

const monthKey = (iso: string) => iso.slice(0, 7)
const sum = (items: number[]) => items.reduce((a, b) => a + b, 0)
const pct = (current: number, previous: number) => (previous === 0 ? 0 : ((current - previous) / previous) * 100)

type DailyRow = { day: string; visitors: number; pageviews: number }

/** Tráfego real (analytics próprio no Supabase). Devolve null se indisponível → cai nos mocks. */
async function loadLiveTraffic() {
  if (!isLive()) return null
  try {
    const db = createAdminClient()
    const [daily, pages, sources] = await Promise.all([
      db.rpc('analytics_daily', { p_days: 60 }),
      db.rpc('analytics_top_pages', { p_days: 30, p_limit: 6 }),
      db.rpc('analytics_sources', { p_days: 30, p_limit: 6 }),
    ])
    if (daily.error) throw daily.error
    const rows = (daily.data ?? []) as DailyRow[]
    const series: TimeSeriesPoint[] = rows.map((r) => ({ date: r.day, value: r.visitors }))
    return { series, topPages: (pages.data ?? []) as PageStat[], sources: (sources.data ?? []) as SourceStat[] }
  } catch (error) {
    console.error('[analytics] leitura de tráfego falhou; a usar dados de demonstração:', error)
    return null
  }
}

async function loadLiveRealtime(): Promise<RealtimeUsers | null> {
  if (!isLive()) return null
  try {
    const db = createAdminClient()
    const [rt, pages] = await Promise.all([db.rpc('analytics_realtime'), db.rpc('analytics_online_pages')])
    if (rt.error) throw rt.error
    const row = (rt.data as { online: number; peak: number; peak_at: string | null }[])[0]
    return {
      online: row?.online ?? 0,
      pages: (pages.data ?? []) as OnlinePage[],
      peakToday: row?.peak ?? 0,
      peakAt: row?.peak_at ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[analytics] leitura de tempo real falhou:', error)
    return null
  }
}

type WonLeadRow = {
  id: string
  company: string
  project_name: string | null
  sector: ClientProject['sector']
  estimated_value: number
  delivery_status: ProjectStatus | null
  margin_pct: number | null
  stage_entered_at: string
  delivered_at: string | null
  client_id: string | null
  payment_type: ClientProject['paymentType'] | null
  payment_installments: number | null
  invoice_id: string | null
}

/**
 * Projetos vendidos/entregues: negócios já ganhos no Pipeline (`leads.stage = 'ganho'`), com o
 * acompanhamento de entrega de `supabase/012_deal_delivery.sql`. Sem Supabase configurado, cai nos
 * dados de demonstração.
 */
export async function listProjects(): Promise<ClientProject[]> {
  if (!isLive()) return mockProjects
  try {
    const { data, error } = await createAdminClient()
      .from('leads')
      .select('id, company, project_name, sector, estimated_value, delivery_status, margin_pct, stage_entered_at, delivered_at, client_id, payment_type, payment_installments, invoice_id')
      .eq('stage', 'ganho')
      .order('stage_entered_at', { ascending: false })
    if (error) throw error
    return (data as WonLeadRow[]).map((r) => ({
      id: r.id,
      client: r.company,
      name: r.project_name ?? 'Projeto sem nome',
      sector: r.sector,
      value: r.estimated_value,
      status: r.delivery_status ?? 'em_desenvolvimento',
      marginPct: r.margin_pct ?? 0,
      soldAt: r.stage_entered_at,
      ...(r.delivered_at ? { deliveredAt: r.delivered_at } : {}),
      ...(r.client_id ? { clientId: r.client_id } : {}),
      ...(r.payment_type ? { paymentType: r.payment_type } : {}),
      ...(r.payment_installments ? { paymentInstallments: r.payment_installments } : {}),
      ...(r.invoice_id ? { invoiceId: r.invoice_id } : {}),
    }))
  } catch (error) {
    console.error('[revenue] leitura de projetos vendidos falhou; a usar dados de demonstração:', error)
    return mockProjects
  }
}

/** Leads/Pipeline: lê a tabela real `leads`; sem Supabase configurado, cai nos dados de demonstração. */
export async function listLeads(): Promise<Lead[]> {
  if (!isLive()) return mockLeads
  try {
    const { data, error } = await createAdminClient().from('leads').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data as LeadRow[]).map((r) => ({
      id: r.id,
      contactName: r.contact_name,
      company: r.company,
      sector: r.sector,
      estimatedValue: r.estimated_value,
      stage: r.stage,
      channel: r.channel,
      stageEnteredAt: r.stage_entered_at,
      createdAt: r.created_at,
      owner: r.owner,
      followUps: r.follow_ups,
      firstResponseHours: r.first_response_hours,
      ...(r.project_name ? { projectName: r.project_name } : {}),
      ...(r.project_type ? { projectType: r.project_type } : {}),
      ...(r.loss_reason ? { lossReason: r.loss_reason } : {}),
      ...(r.client_id ? { clientId: r.client_id } : {}),
    }))
  } catch (error) {
    console.error('[crm] leitura de leads falhou; a usar dados de demonstração:', error)
    return mockLeads
  }
}

type MeetingRow = { id: string; lead_id: string; title: string; start: string; duration_min: number; kind: Meeting['kind'] }

/** Reuniões agendadas com leads; lê a tabela real `meetings`; sem Supabase configurado, cai nos dados de demonstração. */
export async function listMeetings(): Promise<Meeting[]> {
  if (!isLive()) return mockMeetings
  try {
    const { data, error } = await createAdminClient().from('meetings').select('id, lead_id, title, start, duration_min, kind').order('start', { ascending: true })
    if (error) throw error
    return (data as MeetingRow[]).map((r) => ({ id: r.id, leadId: r.lead_id, title: r.title, start: r.start, durationMin: r.duration_min, kind: r.kind }))
  } catch (error) {
    console.error('[crm] leitura de meetings falhou; a usar dados de demonstração:', error)
    return mockMeetings
  }
}

/** Data "de hoje" dos dados de negócio. */
export const businessNow = () => new Date()

function monthlyRevenue(projects: ClientProject[], now: Date, months: number): MonthlyRevenuePoint[] {
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - i), 1))
    const key = d.toISOString().slice(0, 7)
    return { month: d.toISOString().slice(0, 10), revenue: sum(projects.filter((p) => monthKey(p.soldAt) === key).map((p) => p.value)) }
  })
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const now = businessNow()
  const monthKey = now.toISOString().slice(0, 7)

  // Tráfego: últimos 30 dias vs 30 anteriores (real quando disponível)
  const [projects, goals, liveTraffic, liveRealtime] = await Promise.all([listProjects(), listGoals(), loadLiveTraffic(), loadLiveRealtime()])
  // Mesma meta mensal de receita definida em /admin/crm/metas — nunca um valor fixo à parte, para
  // nunca divergir do que a Visão Executiva e o Escritório Virtual mostram (bug corrigido: antes
  // disto, esta página usava uma constante fixa que nunca refletia a meta real).
  const monthlyTarget = goals.find((g) => g.periodType === 'mensal' && g.metric === 'revenue' && g.period === monthKey)?.target ?? 20_000
  const daily = liveTraffic?.series ?? mockDailyVisits
  const current = daily.slice(30)
  const previous = daily.slice(0, 30)
  const visits = sum(current.map((p) => p.value))
  const previousVisits = sum(previous.map((p) => p.value))

  // Receita do mês corrente + projeção linear de fecho
  const history = monthlyRevenue(projects, now, 6)
  const monthToDate = history[history.length - 1].revenue
  const daysElapsed = now.getUTCDate()
  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate()
  const projectedMonthEnd = Math.round((monthToDate / daysElapsed) * daysInMonth)
  const lastMonth = history[history.length - 2].revenue
  history[history.length - 1] = { ...history[history.length - 1], projected: projectedMonthEnd }

  const byStatus = Object.fromEntries(PROJECT_STATUSES.map((s) => [s, projects.filter((p) => p.status === s).length])) as Record<ProjectStatus, number>

  return {
    asOf: now.toISOString(),
    trafficIsLive: Boolean(liveTraffic),
    topPages: liveTraffic?.topPages ?? [],
    sources: liveTraffic?.sources ?? [],
    traffic: { visits, previousVisits, changePct: pct(visits, previousVisits), series: current },
    realtime: liveRealtime ?? { ...mockRealtime, pages: [], updatedAt: now.toISOString() },
    revenue: {
      currency: 'EUR',
      monthToDate,
      projectedMonthEnd,
      monthlyTarget,
      targetProgressPct: (monthToDate / monthlyTarget) * 100,
      changePct: pct(projectedMonthEnd, lastMonth),
    },
    projects: { active: byStatus.em_desenvolvimento + byStatus.em_teste, byStatus },
    revenueHistory: history,
    deliveredBySector: SECTORS.map((sector) => ({ sector, delivered: projects.filter((p) => p.sector === sector && p.status === 'entregue').length })).filter((s) => s.delivered > 0),
  }
}

/** Utilizadores online agora. Mock com oscilação; trocar por leitura de um serviço de analytics. */
export async function getRealtimeUsers(): Promise<RealtimeUsers> {
  const live = await loadLiveRealtime()
  if (live) return live

  const online = Math.max(3, mockRealtime.online + Math.round((Math.random() - 0.5) * 8))
  return { online, pages: [], peakToday: Math.max(mockRealtime.peakToday, online), peakAt: mockRealtime.peakAt, updatedAt: new Date().toISOString() }
}
