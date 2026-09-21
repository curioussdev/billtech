import { MONTHLY_REVENUE_TARGET, mockDailyVisits, mockRealtime } from '@/data/mock/dashboard'
import { mockLeads, mockMeetings } from '@/data/mock/leads'
import { MOCK_NOW, mockProjects } from '@/data/mock/projects'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createAdminClient } from '@/lib/supabase/server'
import type { DashboardOverview, MonthlyRevenuePoint, OnlinePage, PageStat, RealtimeUsers, SourceStat, TimeSeriesPoint } from '@/types/analytics'
import type { Lead, Meeting } from '@/types/lead'
import { PROJECT_STATUSES, SECTORS, type ClientProject, type ProjectStatus } from '@/types/project'

/**
 * CAMADA DE DADOS DO ADMIN.
 * Hoje lê dos mocks em `src/data/mock/`; para ligar ao PostgreSQL basta reescrever estas
 * funções (ex.: com Prisma) mantendo as assinaturas e os tipos de `src/types/`.
 */

const monthKey = (iso: string) => iso.slice(0, 7)
const sum = (items: number[]) => items.reduce((a, b) => a + b, 0)
const pct = (current: number, previous: number) => (previous === 0 ? 0 : ((current - previous) / previous) * 100)

const isLive = () => isSupabaseConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

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

export async function listProjects(): Promise<ClientProject[]> {
  return mockProjects
}

export async function listLeads(): Promise<Lead[]> {
  return mockLeads
}

export async function listMeetings(): Promise<Meeting[]> {
  return mockMeetings
}

/** Data "de hoje" dos dados de negócio (fixa nos mocks; `new Date()` quando vierem da base de dados). */
export const businessNow = () => new Date(MOCK_NOW)

function monthlyRevenue(projects: ClientProject[], now: Date, months: number): MonthlyRevenuePoint[] {
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - i), 1))
    const key = d.toISOString().slice(0, 7)
    return { month: d.toISOString().slice(0, 10), revenue: sum(projects.filter((p) => monthKey(p.soldAt) === key).map((p) => p.value)) }
  })
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const projects = await listProjects()
  const now = new Date(MOCK_NOW)

  // Tráfego: últimos 30 dias vs 30 anteriores (real quando disponível)
  const [liveTraffic, liveRealtime] = await Promise.all([loadLiveTraffic(), loadLiveRealtime()])
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
    asOf: MOCK_NOW,
    trafficIsLive: Boolean(liveTraffic),
    topPages: liveTraffic?.topPages ?? [],
    sources: liveTraffic?.sources ?? [],
    traffic: { visits, previousVisits, changePct: pct(visits, previousVisits), series: current },
    realtime: liveRealtime ?? { ...mockRealtime, pages: [], updatedAt: MOCK_NOW },
    revenue: {
      currency: 'EUR',
      monthToDate,
      projectedMonthEnd,
      monthlyTarget: MONTHLY_REVENUE_TARGET,
      targetProgressPct: (monthToDate / MONTHLY_REVENUE_TARGET) * 100,
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
