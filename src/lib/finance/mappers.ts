import type { ClientLoyalty, Installment, Invoice, Payment } from '@/types/finance'

/** Conversão snake_case (linhas do Postgres) → camelCase (tipos da app) — partilhado entre as
 * leituras do lado do cliente (`queries.ts`) e do lado do admin (`admin-queries.ts`). */

export type InvoiceRow = {
  id: string
  client_id: string
  project_id: string | null
  description: string
  total_amount: number
  discount_amount: number
  discount_code_id: string | null
  final_amount: number
  status: Invoice['status']
  due_date: string
  payment_type: Invoice['paymentType']
  created_at: string
  updated_at: string
}

export type InstallmentRow = {
  id: string
  invoice_id: string
  installment_number: number
  amount: number
  due_date: string
  status: Installment['status']
  stripe_payment_intent_id: string | null
  created_at: string
}

export type PaymentRow = {
  id: string
  invoice_id: string
  installment_id: string | null
  amount: number
  status: Payment['status']
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  payment_method: string
  paid_at: string | null
  created_at: string
}

export type LoyaltyRow = { client_id: string; loyalty_points: number; loyalty_tier: ClientLoyalty['loyaltyTier']; total_spent: number; updated_at: string }

export const mapInvoice = (r: InvoiceRow): Invoice => ({
  id: r.id,
  clientId: r.client_id,
  projectId: r.project_id,
  description: r.description,
  totalAmount: r.total_amount,
  discountAmount: r.discount_amount,
  discountCodeId: r.discount_code_id,
  finalAmount: r.final_amount,
  status: r.status,
  dueDate: r.due_date,
  paymentType: r.payment_type,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

export const mapInstallment = (r: InstallmentRow): Installment => ({
  id: r.id,
  invoiceId: r.invoice_id,
  installmentNumber: r.installment_number,
  amount: r.amount,
  dueDate: r.due_date,
  status: r.status,
  stripePaymentIntentId: r.stripe_payment_intent_id,
  createdAt: r.created_at,
})

export const mapPayment = (r: PaymentRow): Payment => ({
  id: r.id,
  invoiceId: r.invoice_id,
  installmentId: r.installment_id,
  amount: r.amount,
  status: r.status,
  stripePaymentIntentId: r.stripe_payment_intent_id,
  stripeCheckoutSessionId: r.stripe_checkout_session_id,
  paymentMethod: r.payment_method,
  paidAt: r.paid_at,
  createdAt: r.created_at,
})

export const mapLoyalty = (r: LoyaltyRow): ClientLoyalty => ({ clientId: r.client_id, loyaltyPoints: r.loyalty_points, loyaltyTier: r.loyalty_tier, totalSpent: r.total_spent, updatedAt: r.updated_at })
