import type { AdminInvoice } from '@/lib/finance/admin-queries'
import type { ClientFinanceSummary } from '@/types/finance'

export type FinanceKpis = {
  expectedRevenueThisMonth: number
  defaultRatePct: number
  averageLtv: number
  invoicedTotal: number
  cashCollected: number
  collectedPct: number
  repeatClientRatePct: number
}

/**
 * Lógica pura (sem I/O), fácil de testar isoladamente do acesso à base de dados.
 * Nota: a BillTech vende projetos pontuais, não subscrições — por isso não há MRR/ARR/Churn
 * literais aqui. Os equivalentes que fazem sentido para uma agência são "cobrado vs faturado"
 * (cash flow real) e a taxa de clientes repetentes (retenção).
 */
export function computeFinanceKpis(invoices: AdminInvoice[], summaries: ClientFinanceSummary[], now: Date = new Date()): FinanceKpis {
  const billable = invoices.filter((i) => i.status !== 'cancelado')
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

  const expectedRevenueThisMonth = billable.filter((i) => i.dueDate.slice(0, 7) === monthKey).reduce((sum, i) => sum + i.finalAmount, 0)

  const invoicedTotal = billable.reduce((sum, i) => sum + i.finalAmount, 0)
  const totalOverdue = billable.filter((i) => i.status === 'atrasado').reduce((sum, i) => sum + i.finalAmount, 0)
  const defaultRatePct = invoicedTotal > 0 ? (totalOverdue / invoicedTotal) * 100 : 0

  const cashCollected = billable.reduce((sum, i) => sum + i.payments.filter((p) => p.status === 'sucesso').reduce((a, p) => a + p.amount, 0), 0)
  const collectedPct = invoicedTotal > 0 ? (cashCollected / invoicedTotal) * 100 : 0

  const spenders = summaries.filter((s) => s.loyalty.totalSpent > 0)
  const averageLtv = spenders.length > 0 ? spenders.reduce((sum, s) => sum + s.loyalty.totalSpent, 0) / spenders.length : 0

  const clientsWithInvoice = summaries.filter((s) => s.invoiceCount > 0)
  const repeatClients = clientsWithInvoice.filter((s) => s.invoiceCount > 1)
  const repeatClientRatePct = clientsWithInvoice.length > 0 ? (repeatClients.length / clientsWithInvoice.length) * 100 : 0

  return { expectedRevenueThisMonth, defaultRatePct, averageLtv, invoicedTotal, cashCollected, collectedPct, repeatClientRatePct }
}
