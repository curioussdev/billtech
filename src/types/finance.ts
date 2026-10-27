/**
 * Módulo financeiro: faturas, parcelamentos, pagamentos, códigos de desconto e fidelização.
 * Preparado para Stripe (guarda os IDs de payment_intent/checkout session), mas sem nenhuma chamada
 * à Stripe ainda — ver `src/actions/payments.ts`.
 *
 * Adaptação ao que já existe: não há um modelo `Client` próprio — usa-se o `Profile` já existente
 * (`@/lib/auth`) mais `PortalProject` (`@/types/portal`) para o projeto opcional de cada fatura. A
 * fidelização vive isolada em `ClientLoyalty`, 1 registo por perfil.
 */

export const LOYALTY_TIERS = ['bronze', 'silver', 'gold', 'platinum'] as const
export type LoyaltyTier = (typeof LOYALTY_TIERS)[number]

export const INVOICE_STATUSES = ['pendente', 'pago', 'atrasado', 'cancelado'] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export const PAYMENT_TYPES = ['unico', 'parcelado'] as const
export type PaymentType = (typeof PAYMENT_TYPES)[number]

export const INSTALLMENT_STATUSES = ['pendente', 'pago', 'atrasado'] as const
export type InstallmentStatus = (typeof INSTALLMENT_STATUSES)[number]

export const PAYMENT_STATUSES = ['pendente', 'sucesso', 'falhou', 'reembolsado'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export interface ClientLoyalty {
  clientId: string
  loyaltyPoints: number
  loyaltyTier: LoyaltyTier
  totalSpent: number
  updatedAt: string
}

export interface DiscountCode {
  id: string
  code: string
  /** Percentagem (0–100) OU valor fixo em EUR — nunca os dois. */
  percentage: number | null
  fixedAmount: number | null
  isActive: boolean
  usageLimit: number | null
  usedCount: number
  createdAt: string
}

export interface Invoice {
  id: string
  clientId: string
  projectId: string | null
  description: string
  totalAmount: number
  discountAmount: number
  discountCodeId: string | null
  /** total_amount − discount_amount, calculado pela base de dados (nunca diverge). */
  finalAmount: number
  status: InvoiceStatus
  dueDate: string
  paymentType: PaymentType
  createdAt: string
  updatedAt: string
  /** Cliente ativou débito automático para esta fatura (exige um mandato ativo em `autopay_mandates`). */
  autopayEnabled: boolean
}

export const AUTOPAY_METHOD_TYPES = ['card', 'sepa_debit'] as const
export type AutopayMethodType = (typeof AUTOPAY_METHOD_TYPES)[number]

export const AUTOPAY_MANDATE_STATUSES = ['ativo', 'revogado'] as const
export type AutopayMandateStatus = (typeof AUTOPAY_MANDATE_STATUSES)[number]

/** Autorização do cliente para a Stripe cobrar sem ele estar presente — cartão guardado ou débito direto SEPA (IBAN). */
export interface AutopayMandate {
  id: string
  clientId: string
  stripePaymentMethodId: string
  methodType: AutopayMethodType
  stripeSetupIntentId: string | null
  status: AutopayMandateStatus
  createdAt: string
  revokedAt: string | null
}

export interface Installment {
  id: string
  invoiceId: string
  installmentNumber: number
  amount: number
  dueDate: string
  status: InstallmentStatus
  stripePaymentIntentId: string | null
  createdAt: string
}

export interface Payment {
  id: string
  invoiceId: string
  installmentId: string | null
  amount: number
  status: PaymentStatus
  stripePaymentIntentId: string | null
  stripeCheckoutSessionId: string | null
  paymentMethod: string
  paidAt: string | null
  createdAt: string
  /** Admin que registou o pagamento manualmente (fora da plataforma); nulo quando foi o próprio cliente (Stripe). */
  registeredBy: string | null
  /** Referência/nota opcional (ex.: nº de transferência) — só em registos manuais. */
  notes: string
}

/** Fatura com as suas parcelas e pagamentos já carregados — a forma mais usada nas páginas. */
export interface InvoiceWithDetails extends Invoice {
  installments: Installment[]
  payments: Payment[]
}

/** Resumo por cliente, para a lista de fidelização do admin. */
export interface ClientFinanceSummary {
  clientId: string
  clientName: string
  clientEmail: string
  company: string
  loyalty: ClientLoyalty
  invoiceCount: number
  openAmount: number
  overdueCount: number
}

export const EXPENSE_CATEGORIES = ['geral', 'ferramentas', 'marketing', 'subcontratacao', 'infraestrutura', 'impostos'] as const
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

/** Despesa do negócio — completa o ledger unificado ao lado de faturas e pagamentos. */
export interface Expense {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  incurredAt: string
  createdAt: string
}

/** Uma linha do ledger unificado: fatura (faturado), pagamento (recebido) ou despesa (saída). */
export type LedgerEntry =
  | { kind: 'invoice'; date: string; label: string; amount: number }
  | { kind: 'payment'; date: string; label: string; amount: number }
  | { kind: 'expense'; id: string; date: string; label: string; amount: number }
