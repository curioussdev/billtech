import 'server-only'
import Stripe from 'stripe'

/**
 * Configuração da Stripe. Sem chaves definidas, o módulo financeiro continua a funcionar em modo
 * mock (ver `src/actions/payments.ts`) — o mesmo padrão "isConfigured" já usado para o Supabase.
 */
export const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? ''
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

export const isStripeConfigured = Boolean(stripeSecretKey)

/**
 * Métodos de pagamento aceites (decidido: cartão, MB WAY e Multibanco — os três relevantes para
 * clientes em Portugal). O Multibanco é assíncrono: a Stripe só confirma o pagamento horas depois
 * (o cliente paga numa referência, não no ecrã), por isso a fatura fica "pendente" até ao webhook
 * `checkout.session.async_payment_succeeded` confirmar — nunca se marca "pago" à saída do checkout.
 */
export const STRIPE_PAYMENT_METHODS: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = ['card', 'mb_way', 'multibanco']

let client: Stripe | null = null

/** Cliente Stripe (singleton). Lança se chamado sem chave configurada — cada Server Action verifica `isStripeConfigured` antes. */
export function getStripeClient(): Stripe {
  if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY não definida — a Stripe ainda não está ligada.')
  if (!client) client = new Stripe(stripeSecretKey)
  return client
}
