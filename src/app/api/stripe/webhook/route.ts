import 'server-only'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { recordPaymentForLoyalty } from '@/lib/finance/loyalty'
import { getStripeClient, isStripeConfigured, stripeWebhookSecret } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Webhook da Stripe. TEM de ser um Route Handler (não uma Server Action): a Stripe entrega estes
 * eventos com um POST HTTP direto a este endpoint — Server Actions só podem ser invocadas pelo
 * próprio Next.js através do protocolo interno, não são endpoints HTTP que outro serviço possa
 * chamar. Depois de ligar a Stripe a sério, o URL a configurar em Developers → Webhooks é
 * `https://billtech.online/api/stripe/webhook`.
 *
 * Eventos tratados: `checkout.session.completed`/`async_payment_succeeded` (sucesso — o segundo é o
 * caso do Multibanco, que só confirma horas depois), `async_payment_failed` e
 * `payment_intent.payment_failed` (falha). Não usamos `invoice.paid`/`payment_intent.succeeded`
 * isolado: a `Invoice` aqui é uma tabela nossa, não a funcionalidade de faturação da própria Stripe,
 * e o sinal fiável de "pago" para um Checkout Session é o próprio evento de checkout.
 */
export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isStripeConfigured || !stripeWebhookSecret) {
    // Ainda não ligado: responde 200 para a Stripe não ficar a reenviar, mas não faz nada.
    return NextResponse.json({ received: false, reason: 'Stripe ainda não configurada.' })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Assinatura em falta.' }, { status: 400 })

  // CRÍTICO: ler o corpo em bruto, nunca fazer JSON.parse antes — a verificação da assinatura
  // precisa dos bytes exatos que a Stripe enviou (reformatar o JSON, mesmo sem mudar valores, já
  // invalida a assinatura).
  const rawBody = await request.text()

  const stripe = getStripeClient()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret)
  } catch (error) {
    console.error('[stripe webhook] assinatura inválida:', error)
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 })
  }

  const db = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session
      const invoiceId = session.metadata?.invoiceId
      const installmentId = session.metadata?.installmentId || null
      if (invoiceId && session.payment_status === 'paid') {
        await settlePayment(db, invoiceId, installmentId, session.id, typeof session.payment_intent === 'string' ? session.payment_intent : null)
      }
      break
    }
    case 'checkout.session.async_payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session
      await db.from('payments').update({ status: 'falhou' }).eq('stripe_checkout_session_id', session.id)
      break
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent
      await db.from('payments').update({ status: 'falhou' }).eq('stripe_payment_intent_id', intent.id)
      break
    }
    default:
      // Outros eventos (ex.: payment_intent.created) não precisam de ação nossa.
      break
  }

  return NextResponse.json({ received: true })
}

async function settlePayment(db: ReturnType<typeof createAdminClient>, invoiceId: string, installmentId: string | null, sessionId: string, paymentIntentId: string | null) {
  const now = new Date().toISOString()
  await db
    .from('payments')
    .update({ status: 'sucesso', paid_at: now, ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}) })
    .eq('stripe_checkout_session_id', sessionId)

  if (installmentId) {
    await db.from('installments').update({ status: 'pago' }).eq('id', installmentId)
    const { data: remaining } = await db.from('installments').select('id').eq('invoice_id', invoiceId).neq('status', 'pago')
    if (!remaining || remaining.length === 0) await db.from('invoices').update({ status: 'pago', updated_at: now }).eq('id', invoiceId)
  } else {
    await db.from('invoices').update({ status: 'pago', updated_at: now }).eq('id', invoiceId)
  }

  const { data: invoice } = await db.from('invoices').select('client_id, final_amount').eq('id', invoiceId).maybeSingle()
  if (invoice) {
    const { data: payment } = await db.from('payments').select('amount').eq('stripe_checkout_session_id', sessionId).maybeSingle()
    await recordPaymentForLoyalty(db, invoice.client_id, payment?.amount ?? invoice.final_amount)
  }
}
