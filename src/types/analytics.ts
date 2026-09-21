import type { ProjectStatus, Sector } from '@/types/project'

export interface TimeSeriesPoint {
  /** ISO 8601 (dia) */
  date: string
  value: number
}

export interface TrafficKpi {
  /** Visitas nos últimos 30 dias */
  visits: number
  /** Visitas nos 30 dias anteriores */
  previousVisits: number
  /** Variação percentual vs período anterior */
  changePct: number
  series: TimeSeriesPoint[]
}

export interface OnlinePage {
  path: string
  online: number
}

export interface PageStat {
  path: string
  views: number
  visitors: number
}

export interface SourceStat {
  source: string
  visitors: number
}

export interface RealtimeUsers {
  online: number
  /** Páginas onde os utilizadores estão agora */
  pages: OnlinePage[]
  peakToday: number
  /** ISO 8601 */
  peakAt: string
  /** ISO 8601 */
  updatedAt: string
}

export interface RevenueKpi {
  currency: 'EUR'
  monthToDate: number
  projectedMonthEnd: number
  monthlyTarget: number
  /** Percentagem da meta já atingida (0–100+) */
  targetProgressPct: number
  /** Variação do mês corrente vs. o mês anterior completo, em % */
  changePct: number
}

export interface ProjectsKpi {
  active: number
  byStatus: Record<ProjectStatus, number>
}

export interface MonthlyRevenuePoint {
  /** ISO 8601 (primeiro dia do mês) */
  month: string
  /** Receita faturada no mês (mês corrente = até à data) */
  revenue: number
  /** Só no mês corrente: projeção de fecho */
  projected?: number
}

export interface SectorDeliveryPoint {
  sector: Sector
  delivered: number
}

export interface DashboardOverview {
  /** Data de referência dos dados (ISO 8601) */
  asOf: string
  /** true = tráfego e utilizadores online vêm do analytics real; false = dados de demonstração */
  trafficIsLive: boolean
  topPages: PageStat[]
  sources: SourceStat[]
  traffic: TrafficKpi
  realtime: RealtimeUsers
  revenue: RevenueKpi
  projects: ProjectsKpi
  revenueHistory: MonthlyRevenuePoint[]
  deliveredBySector: SectorDeliveryPoint[]
}
