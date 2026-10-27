'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { siteUrl } from '@/data/site'
import { logAudit } from '@/lib/audit'
import { requireAdmin, requireUser } from '@/lib/auth'
import { sendEmail } from '@/lib/contact-delivery'
import { emailLayout } from '@/lib/email-template'
import { formatDate, formatEUR } from '@/lib/finance/labels'
import { mapAutopayMandate, type AutopayMandateRow } from '@/lib/finance/mappers'
import { getStripeClient, isStripeConfigured } from '@/lib/stripe/config'
import { chargeInstallmentOffSession } from '@/lib/stripe/autopay'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Débito automático (cartão guardado ou SEPA Direct Debit) — opcional, ao lado de tudo o que já
 * existe (transferência/numerário registados pelo admin, Checkout pontual por cartão/MB WAY/
 * Multibanco/Klarna). Mesma convenção de `src/actions/payments.ts`: Zod → requireUser/requireAdmin →
 * createAdminClient() → logAudit → revalidatePath → {ok}.
 */

export type AutopayResult = { ok: true } | { ok: false; message: string }

async function getOrCreateStripeCustomerId(db: ReturnType<typeof createAdminClient>, profile: { id: string; email: string; full_name: string }): Promise<string> {
  const { data: current } = await db.from('profiles').select('stripe_customer_id').eq('id', profile.id).maybeSingle()
  if (current?.stripe_customer_id) return current.stripe_customer_id as string

  const stripe = getStripeClient()
  const customer = await stripe.customers.create({ email: profile.email, name: profile.full_name || undefined, metadata: { clientId: profile.id } })
  await db.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', profile.id)
  return customer.id
}

export type AutopaySetupResult = { ok: true; url: string | null; mock: boolean } | { ok: false; message: string }

const setupSchema = z.object({ idempotencyKey: z.string().trim().min(10).max(200) })

/**
 * Cria a sessão de Checkout em modo "setup" (sem cobrar nada) — partilhado entre o cliente a
 * configurar-se a si próprio e o admin a gerar o link em nome de um cliente. **Nunca pedir o número
 * do cartão ou o IBAN por um formulário nosso**: só a página alojada da Stripe os recolhe, nunca
 * passam pelo nosso servidor (evita PCI-DSS a sério e garante que o mandato SEPA é legalmente válido,
 * com o texto que a Stripe já apresenta). O mandato só fica gravado em `autopay_mandates` depois do
 * webhook confirmar, nunca só pelo redirect de sucesso.
 */
async function buildAutopaySetupSession(profile: { id: string; email: string; full_name: string }, idempotencyKey: string): Promise<AutopaySetupResult> {
  if (!isStripeConfigured) return { ok: true, url: null, mock: true }

  try {
    const db = createAdminClient()
    const customerId = await getOrCreateStripeCustomerId(db, profile)
    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'setup',
        customer: customerId,
        payment_method_types: ['card', 'sepa_debit'],
        metadata: { clientId: profile.id },
        success_url: `${siteUrl}/area-cliente/pagamentos/metodo?ativado=1`,
        cancel_url: `${siteUrl}/area-cliente/pagamentos/metodo?cancelado=1`,
      },
      { idempotencyKey },
    )
    return { ok: true, url: session.url, mock: false }
  } catch (error) {
    console.error('[autopay] buildAutopaySetupSession:', error)
    return { ok: false, message: 'Não foi possível iniciar a configuração do débito automático. Tente novamente ou contacte-nos.' }
  }
}

/** O próprio cliente autenticado configura o seu débito automático. */
export async function createAutopaySetupSession(input: unknown): Promise<AutopaySetupResult> {
  const profile = await requireUser()
  const parsed = setupSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' }
  return buildAutopaySetupSession(profile, parsed.data.idempotencyKey)
}

const setupForClientSchema = z.object({ clientId: z.uuid(), idempotencyKey: z.string().trim().min(10).max(200) })

/**
 * Admin gera o mesmo link seguro em nome de um cliente à escolha (ex.: cliente pediu por telefone
 * para configurar o débito automático). O admin nunca vê nem recolhe o cartão/IBAN — só gera o link
 * e entrega-o (`sendAutopaySetupEmail` ou copiando-o) para o cliente completar na própria Stripe.
 */
export async function createAutopaySetupSessionForClient(input: unknown): Promise<AutopaySetupResult> {
  await requireAdmin()
  const parsed = setupForClientSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' }

  const db = createAdminClient()
  const { data: client } = await db.from('profiles').select('id, email, full_name, role').eq('id', parsed.data.clientId).maybeSingle()
  if (!client || client.role !== 'client') return { ok: false, message: 'Cliente não encontrado.' }

  return buildAutopaySetupSession({ id: client.id, email: client.email, full_name: client.full_name ?? '' }, parsed.data.idempotencyKey)
}

const sendSetupEmailSchema = z.object({ clientId: z.uuid(), url: z.url() })

/** Envia por email o link de configuração já gerado — separado de `createAutopaySetupSessionForClient` para o admin poder escolher copiar o link em vez de enviar (ex.: vai ler ao cliente ao telefone). */
export async function sendAutopaySetupEmail(input: unknown): Promise<AutopayResult> {
  const admin = await requireAdmin()
  const parsed = sendSetupEmailSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' }

  const db = createAdminClient()
  const { data: client } = await db.from('profiles').select('email').eq('id', parsed.data.clientId).maybeSingle()
  if (!client?.email) return { ok: false, message: 'Cliente sem email associado.' }

  try {
    await sendEmail({
      to: client.email,
      subject: 'Configure o seu débito automático na BillTech',
      html: emailLayout({
        title: 'Configurar débito automático',
        bodyHtml: `<p>A BillTech preparou um link seguro para guardar o seu cartão ou o IBAN da sua conta, para as próximas parcelas se cobrarem sozinhas — sem ter de voltar a pagar manualmente a cada vencimento.</p><p>É sempre opcional e pode cancelar quando quiser. Nunca é adicionado IVA automaticamente a nada.</p>`,
        cta: { label: 'Configurar agora', href: parsed.data.url },
      }),
    })
  } catch (error) {
    console.error('[autopay] envio do link de configuração falhou:', error)
    return { ok: false, message: 'Não foi possível enviar o email. Pode copiar o link e enviar de outra forma.' }
  }

  await logAudit({ admin, action: 'SEND_AUTOPAY_SETUP_LINK', resource: 'financeiro', targetId: parsed.data.clientId })
  return { ok: true }
}

/** Revoga o mandato ativo do cliente autenticado — desliga-o a sério na Stripe (não só na nossa BD) e desativa o autopay em todas as suas faturas. */
export async function revokeAutopayMandate(): Promise<AutopayResult> {
  const profile = await requireUser()
  const db = createAdminClient()

  const { data: mandateRow } = await db.from('autopay_mandates').select('*').eq('client_id', profile.id).eq('status', 'ativo').maybeSingle()
  if (!mandateRow) return { ok: false, message: 'Não tem nenhum método de débito automático ativo.' }
  const mandate = mapAutopayMandate(mandateRow as AutopayMandateRow)

  if (isStripeConfigured) {
    try {
      await getStripeClient().paymentMethods.detach(mandate.stripePaymentMethodId)
    } catch (error) {
      console.error('[autopay] falha a destacar método de pagamento na Stripe:', error)
      // Continua mesmo assim: se o método já não existir na Stripe (ex. removido lá manualmente), não
      // podemos deixar o cliente preso sem conseguir revogar do lado da BillTech.
    }
  }

  const now = new Date().toISOString()
  await db.from('autopay_mandates').update({ status: 'revogado', revoked_at: now }).eq('id', mandate.id)
  await db.from('invoices').update({ autopay_enabled: false, updated_at: now }).eq('client_id', profile.id).eq('autopay_enabled', true)

  await logAudit({ admin: { id: profile.id, email: profile.email }, action: 'REVOKE_AUTOPAY_MANDATE', resource: 'financeiro', targetId: mandate.id })
  revalidatePath('/area-cliente', 'layout')
  return { ok: true }
}

const setInvoiceAutopaySchema = z.object({ invoiceId: z.uuid(), enabled: z.boolean() })

/** Liga/desliga o débito automático para uma fatura específica — exige um mandato ativo para ligar. */
export async function setInvoiceAutopay(input: unknown): Promise<AutopayResult> {
  const profile = await requireUser()
  const parsed = setInvoiceAutopaySchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' }

  const db = createAdminClient()
  const { data: invoice } = await db.from('invoices').select('id, status').eq('id', parsed.data.invoiceId).eq('client_id', profile.id).maybeSingle()
  if (!invoice) return { ok: false, message: 'Fatura não encontrada.' }
  if (invoice.status === 'pago' || invoice.status === 'cancelado') return { ok: false, message: 'Esta fatura já não aceita pagamento.' }

  if (parsed.data.enabled) {
    const { data: mandate } = await db.from('autopay_mandates').select('id').eq('client_id', profile.id).eq('status', 'ativo').maybeSingle()
    if (!mandate) return { ok: false, message: 'Configure primeiro um método de débito automático.' }
  }

  const { error } = await db.from('invoices').update({ autopay_enabled: parsed.data.enabled, updated_at: new Date().toISOString() }).eq('id', invoice.id)
  if (error) return { ok: false, message: 'Não foi possível atualizar a fatura.' }

  await logAudit({ admin: { id: profile.id, email: profile.email }, action: 'SET_INVOICE_AUTOPAY', resource: 'financeiro', targetId: invoice.id, details: { enabled: parsed.data.enabled } })
  revalidatePath('/area-cliente', 'layout')
  return { ok: true }
}

const chargeNowSchema = z.object({ invoiceId: z.uuid(), installmentId: z.union([z.uuid(), z.literal('')]).optional() })

/**
 * Admin dispara uma cobrança automática agora, para uma fatura/parcela de um cliente com débito
 * automático ativo. Chave de idempotência determinística (fatura+parcela+dia): cliques a mais no
 * mesmo dia nunca cobram duas vezes.
 */
export async function chargeInstallmentNow(input: unknown): Promise<AutopayResult> {
  const admin = await requireAdmin()
  const parsed = chargeNowSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' }
  if (!isStripeConfigured) return { ok: false, message: 'A Stripe ainda não está configurada.' }

  const db = createAdminClient()
  const installmentId = parsed.data.installmentId || null

  const { data: invoice } = await db.from('invoices').select('*').eq('id', parsed.data.invoiceId).maybeSingle()
  if (!invoice) return { ok: false, message: 'Fatura não encontrada.' }
  if (!invoice.autopay_enabled) return { ok: false, message: 'Esta fatura não tem débito automático ativo.' }
  if (invoice.status === 'pago' || invoice.status === 'cancelado') return { ok: false, message: 'Esta fatura já não aceita pagamento.' }

  let amountEur = invoice.final_amount as number
  if (installmentId) {
    const { data: installment } = await db.from('installments').select('*').eq('id', installmentId).eq('invoice_id', invoice.id).maybeSingle()
    if (!installment) return { ok: false, message: 'Parcela não encontrada.' }
    if (installment.status === 'pago') return { ok: false, message: 'Esta parcela já está paga.' }
    amountEur = installment.amount as number
  }

  const [{ data: profile }, { data: mandateRow }] = await Promise.all([
    db.from('profiles').select('stripe_customer_id').eq('id', invoice.client_id).maybeSingle(),
    db.from('autopay_mandates').select('*').eq('client_id', invoice.client_id).eq('status', 'ativo').maybeSingle(),
  ])
  if (!profile?.stripe_customer_id || !mandateRow) return { ok: false, message: 'O cliente não tem débito automático configurado.' }
  const mandate = mapAutopayMandate(mandateRow as AutopayMandateRow)

  const idempotencyKey = `autopay:${invoice.id}:${installmentId ?? 'full'}:${new Date().toISOString().slice(0, 10)}`
  const outcome = await chargeInstallmentOffSession({
    db,
    invoiceId: invoice.id,
    installmentId,
    amountEur,
    stripeCustomerId: profile.stripe_customer_id,
    stripePaymentMethodId: mandate.stripePaymentMethodId,
    idempotencyKey,
  })

  await logAudit({ admin, action: 'TRIGGER_AUTOPAY_CHARGE', resource: 'financeiro', targetId: invoice.id, details: { installmentId, amountEur, outcome: outcome.outcome } })
  revalidatePath('/admin/finance')

  if (outcome.outcome === 'falhou') return { ok: false, message: outcome.message }
  if (outcome.outcome === 'requer_autenticacao') return { ok: false, message: 'O banco do cliente pediu autenticação adicional — nada foi cobrado. Avise o cliente para pagar manualmente.' }
  return { ok: true }
}

const preNoticeSchema = z.object({ invoiceId: z.uuid(), installmentId: z.union([z.uuid(), z.literal('')]).optional(), amountEur: z.coerce.number().positive(), dueDate: z.iso.date() })

/**
 * Aviso prévio ao cliente, antes de uma cobrança automática — a SEPA Direct Debit exige isto por lei
 * (a Stripe trata do texto/aceitação do mandato, mas não do aviso por cada cobrança individual; ver
 * supabase/031_autopay.sql). Disparo manual pelo admin, mesma filosofia do "Cobrar agora": sem cron,
 * o humano decide quando.
 */
export async function sendAutopayPreNotice(input: unknown): Promise<AutopayResult> {
  const admin = await requireAdmin()
  const parsed = preNoticeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' }

  const db = createAdminClient()
  const { data: invoice } = await db.from('invoices').select('client_id, description').eq('id', parsed.data.invoiceId).maybeSingle()
  if (!invoice) return { ok: false, message: 'Fatura não encontrada.' }
  const { data: profile } = await db.from('profiles').select('email').eq('id', invoice.client_id).maybeSingle()
  if (!profile?.email) return { ok: false, message: 'Cliente sem email associado.' }

  try {
    await sendEmail({
      to: profile.email,
      subject: `Vamos cobrar ${formatEUR(parsed.data.amountEur)} em ${formatDate(parsed.data.dueDate)} — ${invoice.description}`,
      html: emailLayout({
        title: 'Próxima cobrança automática',
        bodyHtml: `<p>Vamos cobrar automaticamente <strong>${formatEUR(parsed.data.amountEur)}</strong> referentes a "${invoice.description}" no dia <strong>${formatDate(parsed.data.dueDate)}</strong>, pelo método de débito automático que configurou. Nada foi cobrado ainda.</p><p>Se preferir pagar de outra forma ou cancelar o débito automático, pode fazê-lo a qualquer momento na sua área de cliente antes dessa data.</p>`,
        cta: { label: 'Ver fatura', href: `${siteUrl}/area-cliente/pagamentos/${parsed.data.invoiceId}` },
      }),
    })
  } catch (error) {
    console.error('[autopay] envio do aviso prévio falhou:', error)
    return { ok: false, message: 'Não foi possível enviar o email. Tente novamente.' }
  }

  await logAudit({ admin, action: 'SEND_AUTOPAY_NOTICE', resource: 'financeiro', targetId: parsed.data.invoiceId, details: { installmentId: parsed.data.installmentId || null, amountEur: parsed.data.amountEur, dueDate: parsed.data.dueDate } })
  return { ok: true }
}

// IBAN: 2 letras de país + 2 dígitos de verificação + 10–30 alfanuméricos — validação de formato só
// (a validação a sério, dígito de controlo incluído, fica a cargo da Stripe, que recusa com erro claro).
const ibanSchema = z
  .string()
  .trim()
  .toUpperCase()
  .transform((v) => v.replace(/\s+/g, ''))
  .pipe(z.string().regex(/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/, 'IBAN com formato inválido.'))

const createSepaSchema = z.object({
  clientId: z.uuid(),
  iban: ibanSchema,
  accountHolderName: z.string().trim().min(2, 'Indique o nome do titular da conta.').max(160),
  authorizationNote: z.string().trim().min(5, 'Explique como foi obtida a autorização do cliente (fica registado na auditoria).').max(300),
})

/**
 * Admin regista o IBAN de um cliente diretamente — seguro de fazer do lado do servidor porque IBAN
 * não é dado "PCI" (isso é só para cartão). A Stripe suporta explicitamente mandatos recolhidos fora
 * da própria página dela (telefone, papel assinado) via `customer_acceptance: {type: 'offline'}` — é
 * exatamente esse caminho que isto usa. `authorizationNote` fica sempre na auditoria: é a prova de
 * como o cliente autorizou, já que não foi ele a escrever isto na Stripe.
 */
export async function createSepaMandateWithIban(input: unknown): Promise<AutopayResult> {
  const admin = await requireAdmin()
  const parsed = createSepaSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  if (!isStripeConfigured) return { ok: false, message: 'A Stripe ainda não está configurada.' }

  const db = createAdminClient()
  const { data: client } = await db.from('profiles').select('id, email, full_name, role').eq('id', parsed.data.clientId).maybeSingle()
  if (!client || client.role !== 'client') return { ok: false, message: 'Cliente não encontrado.' }

  try {
    const customerId = await getOrCreateStripeCustomerId(db, { id: client.id, email: client.email, full_name: client.full_name ?? '' })
    const stripe = getStripeClient()

    const paymentMethod = await stripe.paymentMethods.create({
      type: 'sepa_debit',
      sepa_debit: { iban: parsed.data.iban },
      billing_details: { name: parsed.data.accountHolderName, email: client.email },
    })
    await stripe.paymentMethods.attach(paymentMethod.id, { customer: customerId })

    await stripe.setupIntents.create({
      customer: customerId,
      payment_method: paymentMethod.id,
      payment_method_types: ['sepa_debit'],
      confirm: true,
      mandate_data: { customer_acceptance: { type: 'offline' } },
    })

    await db.from('autopay_mandates').update({ status: 'revogado', revoked_at: new Date().toISOString() }).eq('client_id', client.id).eq('status', 'ativo')
    await db.from('autopay_mandates').insert({ client_id: client.id, stripe_payment_method_id: paymentMethod.id, payment_method_type: 'sepa_debit', status: 'ativo' })
  } catch (error) {
    console.error('[autopay] createSepaMandateWithIban:', error)
    const message = error instanceof Error ? error.message : 'Não foi possível registar o IBAN.'
    return { ok: false, message }
  }

  await logAudit({ admin, action: 'CREATE_SEPA_MANDATE_OFFLINE', resource: 'financeiro', targetId: client.id, details: { authorizationNote: parsed.data.authorizationNote, ibanLast4: parsed.data.iban.slice(-4) } })
  revalidatePath('/admin/finance/pagamentos')
  revalidatePath(`/admin/clientes/${client.id}`)
  return { ok: true }
}
