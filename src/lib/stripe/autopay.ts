import 'server-only'
import type Stripe from 'stripe'
import { getStripeClient } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Cobrança automática fora de sessão (off-session) — a parte "a Stripe" do débito automático. Nunca
 * marca uma parcela/fatura como paga diretamente: isso fica sempre a cargo do webhook
 * (`payment_intent.succeeded`), o mesmo caminho único que já existe para o Checkout pontual — evita
 * dois sítios do código a escreverem o mesmo "pago" em paralelo.
 */

export type AutopayChargeOutcome =
  | { outcome: 'sucesso'; paymentIntentId: string }
  /** SEPA Direct Debit confirma dias depois — nem sucesso nem falha ainda, fica "pendente" até ao webhook. */
  | { outcome: 'processando'; paymentIntentId: string }
  /** O banco do cliente pediu autenticação extra (3DS) — nada foi cobrado. */
  | { outcome: 'requer_autenticacao'; paymentIntentId: string | null }
  | { outcome: 'falhou'; paymentIntentId: string | null; message: string }

export async function chargeInstallmentOffSession(params: {
  db: ReturnType<typeof createAdminClient>
  invoiceId: string
  installmentId: string | null
  amountEur: number
  stripeCustomerId: string
  stripePaymentMethodId: string
  idempotencyKey: string
}): Promise<AutopayChargeOutcome> {
  const { db, invoiceId, installmentId, amountEur, stripeCustomerId, stripePaymentMethodId, idempotencyKey } = params
  const stripe = getStripeClient()

  // Grava a tentativa PRIMEIRO (mesmo princípio de createCheckoutSession em src/actions/payments.ts):
  // mesmo que a chamada à Stripe falhe a meio, fica sempre um registo do que se tentou.
  const { data: paymentRow, error: insertError } = await db
    .from('payments')
    .insert({ invoice_id: invoiceId, installment_id: installmentId, amount: amountEur, status: 'pendente', payment_method: 'autopay' })
    .select('id')
    .single()
  if (insertError || !paymentRow) return { outcome: 'falhou', paymentIntentId: null, message: 'Não foi possível registar a tentativa de cobrança.' }

  try {
    const intent = await stripe.paymentIntents.create(
      {
        customer: stripeCustomerId,
        payment_method: stripePaymentMethodId,
        amount: Math.round(amountEur * 100),
        currency: 'eur',
        off_session: true,
        confirm: true,
        metadata: { invoiceId, installmentId: installmentId ?? '', source: 'autopay' },
      },
      { idempotencyKey },
    )
    await db.from('payments').update({ stripe_payment_intent_id: intent.id }).eq('id', paymentRow.id)

    // succeeded aqui é só a resposta síncrona da Stripe — quem marca a parcela/fatura "paga" é sempre
    // o webhook (payment_intent.succeeded), nunca este caminho.
    if (intent.status === 'succeeded') return { outcome: 'sucesso', paymentIntentId: intent.id }
    return { outcome: 'processando', paymentIntentId: intent.id }
  } catch (error) {
    const stripeError = error as Stripe.errors.StripeError
    const requiresAction = stripeError.code === 'authentication_required'
    await db
      .from('payments')
      .update({
        status: 'falhou',
        notes: requiresAction ? 'Requer autenticação adicional (3DS) — pedir ao cliente para confirmar manualmente.' : `Cobrança automática falhou: ${stripeError.message ?? 'erro desconhecido'}`,
      })
      .eq('id', paymentRow.id)

    if (requiresAction) {
      const intentId = (stripeError.raw as { payment_intent?: { id?: string } } | undefined)?.payment_intent?.id ?? null
      return { outcome: 'requer_autenticacao', paymentIntentId: intentId }
    }
    return { outcome: 'falhou', paymentIntentId: null, message: stripeError.message ?? 'Cobrança automática falhou.' }
  }
}
