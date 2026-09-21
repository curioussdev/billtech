import { MONTHLY_REVENUE_TARGET, mockDailyVisits, mockRealtime } from '@/data/mock/dashboard'
import { MOCK_NOW, mockProjects } from '@/data/mock/projects'
import type { DashboardOverview, MonthlyRevenuePoint, RealtimeUsers } from '@/types/analytics'
import { PROJECT_STATUSES, SECTORS, type ClientProject, type ProjectStatus } from '@/types/project'

/**
 * CAMADA DE DADOS DO ADMIN.
 * Hoje lê dos mocks em `src/data/mock/`; para ligar ao PostgreSQL basta reescrever estas
 * funções (ex.: com Prisma) mantendo as assinaturas e os tipos de `src/types/`.
 */

const monthKey = (iso: string) => iso.slice(0, 7)
const sum = (items: number[]) => items.reduce((a, b) => a + b, 0)
const pct = (current: number, previous: number) => (previous === 0 ? 0 : ((current - previous) / previous) * 100)

export async function listProjects(): Promise<ClientProject[]> {
  return mockProjects
}

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

  // Tráfego: últimos 30 dias vs 30 anteriores
  const current = mockDailyVisits.slice(30)
  const previous = mockDailyVisits.slice(0, 30)
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
    traffic: { visits, previousVisits, changePct: pct(visits, previousVisits), series: current },
    realtime: { ...mockRealtime, updatedAt: MOCK_NOW },
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
  const online = Math.max(3, mockRealtime.online + Math.round((Math.random() - 0.5) * 8))
  return { online, peakToday: Math.max(mockRealtime.peakToday, online), peakAt: mockRealtime.peakAt, updatedAt: new Date().toISOString() }
}
