import type { AdminInvoice } from '@/lib/finance/admin-queries'
import type { ClientFinanceSummary } from '@/types/finance'

export type FinanceKpis = {
  expectedRevenueThisMonth: number
  defaultRatePct: number
  averageLtv: number
}

/** Lógica pura (sem I/O), fácil de testar isoladamente do acesso à base de dados. */
export function computeFinanceKpis(invoices: AdminInvoice[], summaries: ClientFinanceSummary[], now: Date = new Date()): FinanceKpis {
  const billable = invoices.filter((i) => i.status !== 'cancelado')
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

  const expectedRevenueThisMonth = billable.filter((i) => i.dueDate.slice(0, 7) === monthKey).reduce((sum, i) => sum + i.finalAmount, 0)

  const totalBillable = billable.reduce((sum, i) => sum + i.finalAmount, 0)
  const totalOverdue = billable.filter((i) => i.status === 'atrasado').reduce((sum, i) => sum + i.finalAmount, 0)
  const defaultRatePct = totalBillable > 0 ? (totalOverdue / totalBillable) * 100 : 0

  const spenders = summaries.filter((s) => s.loyalty.totalSpent > 0)
  const averageLtv = spenders.length > 0 ? spenders.reduce((sum, s) => sum + s.loyalty.totalSpent, 0) / spenders.length : 0

  return { expectedRevenueThisMonth, defaultRatePct, averageLtv }
}
