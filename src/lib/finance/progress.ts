import type { Installment, InvoiceStatus, PaymentType } from '@/types/finance'

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
 * do cliente e no admin para os dois mostrarem sempre o mesmo número.
 */
export function paymentProgress(invoice: { finalAmount: number; paymentType: PaymentType; status: InvoiceStatus; installments: Installment[] }): PaymentProgress {
  if (invoice.paymentType === 'parcelado' && invoice.installments.length > 0) {
    const paid = invoice.installments.filter((i) => i.status === 'pago')
    const paidAmount = paid.reduce((sum, i) => sum + i.amount, 0)
    return {
      paidAmount,
      totalAmount: invoice.finalAmount,
      remainingAmount: Math.max(0, invoice.finalAmount - paidAmount),
      paidCount: paid.length,
      totalCount: invoice.installments.length,
      pct: invoice.finalAmount > 0 ? (paidAmount / invoice.finalAmount) * 100 : 0,
    }
  }
  const paidAmount = invoice.status === 'pago' ? invoice.finalAmount : 0
  return {
    paidAmount,
    totalAmount: invoice.finalAmount,
    remainingAmount: Math.max(0, invoice.finalAmount - paidAmount),
    paidCount: paidAmount > 0 ? 1 : 0,
    totalCount: 1,
    pct: paidAmount > 0 ? 100 : 0,
  }
}
