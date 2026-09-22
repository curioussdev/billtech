import type { InstallmentStatus, InvoiceStatus, LoyaltyTier, PaymentType } from '@/types/finance'

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
}

export const installmentStatusLabels: Record<InstallmentStatus, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  atrasado: 'Atrasado',
}

export const paymentTypeLabels: Record<PaymentType, string> = { unico: 'Pagamento único', parcelado: 'Parcelado' }

export const loyaltyTierLabels: Record<LoyaltyTier, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' }

/** Ordem crescente de nível — usado para saber "o próximo" a partir do atual. */
export const LOYALTY_TIER_ORDER: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum']

const eur = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })
export const formatEUR = (value: number) => eur.format(value)

export const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })
