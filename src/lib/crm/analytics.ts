import type { Interaction } from '@/types/crm'

/**
 * Lógica pura de cálculo do CRM (sem I/O, testável isoladamente).
 * Corresponde a `src/lib/analytics.ts` do pedido original — vive em `src/lib/crm/` para seguir o
 * mesmo padrão de namespacing já usado no projeto (`src/lib/admin/`, `src/lib/portal/`).
 */

/** Win Rate: negócios ganhos ÷ propostas enviadas (não ÷ todos os leads, que é a "taxa de conversão geral" já existente em `funnelMetrics`). */
export function calculateWinRate(wonDeals: number, totalProposals: number): number {
  return totalProposals > 0 ? (wonDeals / totalProposals) * 100 : 0
}

/**
 * Soma o valor dos negócios fechados num mês (chave 'AAAA-MM').
 * Chamamos-lhe MRR só para bater com o vocabulário do pedido original: a BillTech vende projetos,
 * não subscrições, por isso isto é receita de fecho do mês, não receita recorrente de verdade.
 */
export function calculateMRR(deals: { status: string; value: number; closedAt: string | null }[], monthKey: string): number {
  return deals.filter((d) => d.status === 'ganho' && d.closedAt?.startsWith(monthKey)).reduce((sum, d) => sum + d.value, 0)
}

/** % de cold calls que resultaram em reunião agendada. */
export function calculateColdCallHitRate(interactions: Interaction[]): number {
  const calls = interactions.filter((i) => i.type === 'cold_call')
  return calls.length > 0 ? (calls.filter((i) => i.outcome === 'agendado').length / calls.length) * 100 : 0
}

/** Pace: progresso atual face à meta, em percentagem (pode passar de 100). */
export function calculatePace(current: number, target: number): number {
  return target > 0 ? (current / target) * 100 : 0
}

/** Projeção linear simples: mantém o ritmo médio mensal até ao fim do ano. */
export function projectYearlyRevenue(currentRevenue: number, monthsElapsed: number): number {
  return monthsElapsed > 0 ? (currentRevenue / monthsElapsed) * 12 : 0
}

/** Chave de semana ISO 8601 (ex.: "2026-W39"). Segunda-feira como início de semana. */
export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export type GroupPeriod = 'day' | 'week' | 'month' | 'year'

/** Agrupa registos por dia, semana (ISO), mês ou ano, a partir de um campo de data ISO 8601. */
export function groupByPeriod<T>(data: T[], dateField: keyof T, period: GroupPeriod): Record<string, T[]> {
  const out: Record<string, T[]> = {}
  for (const item of data) {
    const raw = item[dateField]
    if (typeof raw !== 'string') continue
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) continue
    const key = period === 'day' ? raw.slice(0, 10) : period === 'month' ? raw.slice(0, 7) : period === 'year' ? raw.slice(0, 4) : isoWeekKey(date)
    ;(out[key] ??= []).push(item)
  }
  return out
}
