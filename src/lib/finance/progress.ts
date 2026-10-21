import type { Installment, Payment, PaymentType } from '@/types/finance'

export interface PaymentProgress {
  paidAmount: number
  totalAmount: number
  remainingAmount: number
  paidCount: number
  totalCount: number
  pct: number
}

/**
 * Quanto já foi pago de uma fatura — parcelada ou não. Lógica pura (sem I/O), reutilizada no lado
 * do cliente e no admin para os dois mostrarem sempre o mesmo número. O valor pago vem sempre do
 * livro-razão `payments` (soma dos `status === 'sucesso'`), nunca do estado das parcelas/da fatura
 * — só assim um pagamento parcial livre (não ligado a nenhuma parcela) também conta.
 */
export function paymentProgress(invoice: { finalAmount: number; paymentType: PaymentType; installments: Installment[]; payments: Payment[] }): PaymentProgress {
  const paidAmount = invoice.payments.filter((p) => p.status === 'sucesso').reduce((sum, p) => sum + p.amount, 0)
  const totalAmount = invoice.finalAmount
  const remainingAmount = Math.max(0, totalAmount - paidAmount)
  const pct = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

  if (invoice.paymentType === 'parcelado' && invoice.installments.length > 0) {
    return { paidAmount, totalAmount, remainingAmount, paidCount: invoice.installments.filter((i) => i.status === 'pago').length, totalCount: invoice.installments.length, pct }
  }
  return { paidAmount, totalAmount, remainingAmount, paidCount: paidAmount > 0 && remainingAmount === 0 ? 1 : 0, totalCount: 1, pct }
}
