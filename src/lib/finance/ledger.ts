import type { AdminInvoice } from '@/lib/finance/admin-queries'
import type { Expense, LedgerEntry } from '@/types/finance'

/**
 * Ledger unificado: faturado (faturas), recebido (pagamentos com sucesso) e despesas, numa única
 * linha do tempo. Lógica pura (sem I/O) — fácil de testar isoladamente do acesso à base de dados.
 */
export function buildLedger(invoices: AdminInvoice[], expenses: Expense[]): LedgerEntry[] {
  const entries: LedgerEntry[] = []

  for (const invoice of invoices) {
    if (invoice.status === 'cancelado') continue
    entries.push({ kind: 'invoice', date: invoice.dueDate, label: `Fatura — ${invoice.clientName}: ${invoice.description}`, amount: invoice.finalAmount })
    for (const payment of invoice.payments) {
      if (payment.status !== 'sucesso' || !payment.paidAt) continue
      entries.push({ kind: 'payment', date: payment.paidAt.slice(0, 10), label: `Pagamento recebido — ${invoice.clientName}`, amount: payment.amount })
    }
  }

  for (const expense of expenses) {
    entries.push({ kind: 'expense', id: expense.id, date: expense.incurredAt, label: expense.description, amount: expense.amount })
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date))
}
