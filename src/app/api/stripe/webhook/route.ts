import 'server-only'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { siteUrl } from '@/data/site'
import { sendEmail } from '@/lib/contact-delivery'
import { emailLayout } from '@/lib/email-template'
import { formatEUR } from '@/lib/finance/labels'
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
 * Eventos tratados:
 * - `checkout.session.completed` (mode:'payment') / `async_payment_succeeded` — pagamento pontual
 *   (o segundo é o caso do Multibanco/Klarna, que só confirmam mais tarde).
 * - `checkout.session.completed` (mode:'setup') — fim da configuração do débito automático: grava o
 *   mandato em `autopay_mandates` (nunca antes disto, nunca só pelo redirect de sucesso).
 * - `payment_intent.succeeded` com `metadata.source==='autopay'` — cobrança automática off-session
 *   confirmada (cartão: quase sempre síncrono; SEPA: só dias depois).
 * - `checkout.session.async_payment_failed` / `payment_intent.payment_failed` — falha. Quando a falha
 *   é de uma cobrança automática (`metadata.source==='autopay'`), avisa o cliente por email com um
 *   link de volta à fatura — é lá que o botão "Pagar" já existente resolve o resto, sem precisar de
 *   nenhum código novo de pagamento no browser.
 * - `mandate.updated` (SEPA ficou `inactive`) e `decline_code: 'revocation_of_authorization'` (cartão)
 *   — o cliente cancelou o débito automático diretamente no banco dele, sem passar por nós (direito
 *   que tem sempre, independente do botão "Remover" na área de cliente). Detetamos isto e desligamos
 *   o mandato do nosso lado, para pararmos de tentar cobrar algo que o banco já recusa.
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
      if (session.mode === 'setup') {
        if (event.type === 'checkout.session.completed') await saveAutopayMandate(db, session)
        break
      }
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
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent
      if (intent.metadata?.source === 'autopay' && intent.metadata?.invoiceId) {
        await settlePaymentByIntent(db, intent.metadata.invoiceId, intent.metadata.installmentId || null, intent.id)
      }
      break
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent
      await db.from('payments').update({ status: 'falhou' }).eq('stripe_payment_intent_id', intent.id)
      if (intent.metadata?.source === 'autopay' && intent.metadata?.invoiceId) {
        await notifyAutopayFailure(db, intent.metadata.invoiceId)
      }
      // Autorização revogada pelo próprio banco do cliente (cartão) — não há nada a tentar de novo.
      if (intent.last_payment_error?.decline_code === 'revocation_of_authorization') {
        const paymentMethodId = typeof intent.payment_method === 'string' ? intent.payment_method : intent.payment_method?.id
        if (paymentMethodId) await revokeMandateByPaymentMethod(db, paymentMethodId)
      }
      break
    }
    case 'mandate.updated': {
      // SEPA Direct Debit: o cliente cancelou o mandato diretamente no banco — a Stripe marca-o `inactive`.
      const mandate = event.data.object as Stripe.Mandate
      if (mandate.status === 'inactive') {
        const paymentMethodId = typeof mandate.payment_method === 'string' ? mandate.payment_method : mandate.payment_method?.id
        if (paymentMethodId) await revokeMandateByPaymentMethod(db, paymentMethodId)
      }
      break
    }
    default:
      // Outros eventos (ex.: payment_intent.created) não precisam de ação nossa.
      break
  }

  return NextResponse.json({ received: true })
}

/** Grava o mandato de débito automático depois de o cliente concluir a configuração (Checkout em modo "setup"). Substitui qualquer mandato ativo anterior do mesmo cliente (só pode haver um). */
async function saveAutopayMandate(db: ReturnType<typeof createAdminClient>, session: Stripe.Checkout.Session) {
  const clientId = session.metadata?.clientId
  if (!clientId || !session.setup_intent) return

  try {
    const stripe = getStripeClient()
    const setupIntentId = typeof session.setup_intent === 'string' ? session.setup_intent : session.setup_intent.id
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
    const paymentMethodId = typeof setupIntent.payment_method === 'string' ? setupIntent.payment_method : setupIntent.payment_method?.id
    if (!paymentMethodId) return

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    const methodType = paymentMethod.type === 'sepa_debit' ? 'sepa_debit' : 'card'

    await db.from('autopay_mandates').update({ status: 'revogado', revoked_at: new Date().toISOString() }).eq('client_id', clientId).eq('status', 'ativo')
    await db.from('autopay_mandates').insert({ client_id: clientId, stripe_payment_method_id: paymentMethodId, payment_method_type: methodType, stripe_setup_intent_id: setupIntentId, status: 'ativo' })
  } catch (error) {
    console.error('[stripe webhook] gravação do mandato de débito automático falhou:', error)
  }
}

/**
 * Desliga o nosso mandato quando o banco do cliente o cancela do lado dele (SEPA ficou `inactive`, ou
 * o cartão recusa com `revocation_of_authorization`) — sem chamar `paymentMethods.detach`, já está
 * morto do lado da Stripe. Mesmo efeito de `revokeAutopayMandate` (Server Action, quando é o próprio
 * cliente a remover pela área dele), só que despoletado pelo banco em vez de um clique nosso.
 */
async function revokeMandateByPaymentMethod(db: ReturnType<typeof createAdminClient>, stripePaymentMethodId: string) {
  try {
    const { data: mandate } = await db.from('autopay_mandates').select('id, client_id').eq('stripe_payment_method_id', stripePaymentMethodId).eq('status', 'ativo').maybeSingle()
    if (!mandate) return

    const now = new Date().toISOString()
    await db.from('autopay_mandates').update({ status: 'revogado', revoked_at: now }).eq('id', mandate.id)
    await db.from('invoices').update({ autopay_enabled: false, updated_at: now }).eq('client_id', mandate.client_id).eq('autopay_enabled', true)
  } catch (error) {
    console.error('[stripe webhook] revogação de mandato por cancelamento no banco falhou:', error)
  }
}

/** Marca a parcela paga (e a fatura, se foi a última) ou a fatura inteira — devolve o client_id para a fidelização. */
async function markInstallmentOrInvoicePaid(db: ReturnType<typeof createAdminClient>, invoiceId: string, installmentId: string | null): Promise<string | undefined> {
  const now = new Date().toISOString()
  if (installmentId) {
    await db.from('installments').update({ status: 'pago' }).eq('id', installmentId)
    const { data: remaining } = await db.from('installments').select('id').eq('invoice_id', invoiceId).neq('status', 'pago')
    if (!remaining || remaining.length === 0) await db.from('invoices').update({ status: 'pago', updated_at: now }).eq('id', invoiceId)
  } else {
    await db.from('invoices').update({ status: 'pago', updated_at: now }).eq('id', invoiceId)
  }
  const { data: invoice } = await db.from('invoices').select('client_id').eq('id', invoiceId).maybeSingle()
  return invoice?.client_id as string | undefined
}

/** Assenta um pagamento vindo de um Checkout Session (pontual) — identificado por `stripe_checkout_session_id`. */
async function settlePayment(db: ReturnType<typeof createAdminClient>, invoiceId: string, installmentId: string | null, sessionId: string, paymentIntentId: string | null) {
  const now = new Date().toISOString()
  await db
    .from('payments')
    .update({ status: 'sucesso', paid_at: now, ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}) })
    .eq('stripe_checkout_session_id', sessionId)

  const clientId = await markInstallmentOrInvoicePaid(db, invoiceId, installmentId)
  if (clientId) {
    const { data: payment } = await db.from('payments').select('amount').eq('stripe_checkout_session_id', sessionId).maybeSingle()
    await recordPaymentForLoyalty(db, clientId, payment?.amount ?? 0)
  }
}

/** Assenta um pagamento vindo de uma cobrança automática (off-session) — identificado por `stripe_payment_intent_id`. */
async function settlePaymentByIntent(db: ReturnType<typeof createAdminClient>, invoiceId: string, installmentId: string | null, paymentIntentId: string) {
  const now = new Date().toISOString()
  await db.from('payments').update({ status: 'sucesso', paid_at: now }).eq('stripe_payment_intent_id', paymentIntentId).eq('status', 'pendente')

  const clientId = await markInstallmentOrInvoicePaid(db, invoiceId, installmentId)
  if (clientId) {
    const { data: payment } = await db.from('payments').select('amount').eq('stripe_payment_intent_id', paymentIntentId).maybeSingle()
    await recordPaymentForLoyalty(db, clientId, payment?.amount ?? 0)
  }
}

/** Avisa o cliente por email quando uma cobrança automática falha — link de volta à fatura, onde o botão "Pagar" já existente resolve o resto. Nunca deixa uma falha no envio rebentar o webhook. */
async function notifyAutopayFailure(db: ReturnType<typeof createAdminClient>, invoiceId: string) {
  try {
    const { data: invoice } = await db.from('invoices').select('client_id, description, final_amount').eq('id', invoiceId).maybeSingle()
    if (!invoice) return
    const { data: profile } = await db.from('profiles').select('email').eq('id', invoice.client_id).maybeSingle()
    if (!profile?.email) return

    await sendEmail({
      to: profile.email,
      subject: `Não foi possível cobrar automaticamente — ${invoice.description}`,
      html: emailLayout({
        title: 'A cobrança automática não foi concluída',
        bodyHtml: `<p>Tentámos cobrar automaticamente ${formatEUR(invoice.final_amount as number)} referentes a "${invoice.description}" e não foi possível — pode ter sido uma confirmação extra pedida pelo seu banco, ou falta de saldo/mandato. <strong>Nada foi cobrado.</strong></p><p>Pode concluir o pagamento manualmente a qualquer momento na sua área de cliente.</p>`,
        cta: { label: 'Ver fatura e pagar', href: `${siteUrl}/area-cliente/pagamentos/${invoiceId}` },
      }),
    })
  } catch (error) {
    console.error('[stripe webhook] envio do email de falha de débito automático falhou:', error)
  }
}
