import type { TimeSeriesPoint } from '@/types/analytics'
import { MOCK_NOW } from '@/data/mock/projects'

/** DADOS DE DEMONSTRAÇÃO — não vêm de nenhuma ferramenta de analytics real. */

export const MONTHLY_REVENUE_TARGET = 18_000

/** Visitas diárias dos últimos 60 dias (índice 59 = hoje). Determinístico: sem Math.random. */
export const mockDailyVisits: TimeSeriesPoint[] = Array.from({ length: 60 }, (_, i) => {
  const date = new Date(new Date(MOCK_NOW).getTime() - (59 - i) * 86_400_000)
  const weekly = 38 * Math.sin((i * 2 * Math.PI) / 7 + 1)
  const noise = 22 * Math.sin(i * 1.7)
  const trend = i * 1.9
  return { date: date.toISOString().slice(0, 10), value: Math.max(40, Math.round(150 + weekly + noise + trend)) }
})

export const mockRealtime = {
  online: 17,
  peakToday: 31,
  peakAt: '2026-09-21T11:42:00.000Z',
}
