import 'server-only'
import Stripe from 'stripe'

/**
 * Configuração da Stripe. Sem chaves válidas, o módulo financeiro continua a funcionar em modo mock
 * (ver `src/actions/payments.ts`) — o mesmo padrão "isConfigured" já usado para o Supabase.
 *
 * Nomes das variáveis: usa as que já estão no `.env.local` deste projeto — `STRIPE_API_PUBLIC_KEY`,
 * `STRIPE_API_SECRET_KEY`, `STRIPE_API_WEBHOOK_KEY` — em vez dos nomes "de manual" da Stripe
 * (STRIPE_SECRET_KEY, etc.). A chave publicável não é usada em lado nenhum do código atual: como o
 * checkout é a página alojada da própria Stripe (decisão da Fase 2), nunca corre `@stripe/stripe-js`
 * no browser — por isso não precisa do prefixo NEXT_PUBLIC_. Fica aqui só pronta, caso um dia se
 * queira um formulário de pagamento embutido.
 */
export const stripeSecretKey = process.env.STRIPE_API_SECRET_KEY ?? ''
export const stripeWebhookSecret = process.env.STRIPE_API_WEBHOOK_KEY ?? ''
export const stripePublishableKey = process.env.STRIPE_API_PUBLIC_KEY ?? ''

/**
 * Validação de formato, não só de presença: uma chave secreta da Stripe começa sempre por `sk_` ou
 * `rk_` (chave restrita) e tem uma centena de caracteres. Isto existe porque já apanhámos um caso
 * real onde o valor guardado era o ID da chave (`mk_…`, o que aparece listado no dashboard), não a
 * própria chave — a Stripe recusa-o com 401, mas preferimos nunca tentar sequer, e continuar em modo
 * mock com uma mensagem clara, em vez de deixar o cliente carregar num botão que vai sempre falhar.
 */
function looksLikeSecretKey(key: string): boolean {
  return /^(sk|rk)_(live|test)_[A-Za-z0-9]{20,}$/.test(key)
}

export const isStripeConfigured = looksLikeSecretKey(stripeSecretKey)

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
  if (!isStripeConfigured) throw new Error('STRIPE_API_SECRET_KEY não definida (ou não tem o formato de uma chave secreta válida) — a Stripe ainda não está ligada.')
  if (!client) client = new Stripe(stripeSecretKey)
  return client
}
