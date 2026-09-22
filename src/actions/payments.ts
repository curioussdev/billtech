'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { siteUrl } from '@/data/site'
import { logAudit } from '@/lib/audit'
import { requireAdmin, requireUser } from '@/lib/auth'
import { buildInstallmentRows } from '@/lib/finance/installments'
import { recordPaymentForLoyalty, tierForSpend } from '@/lib/finance/loyalty'
import { getStripeClient, isStripeConfigured, STRIPE_PAYMENT_METHODS } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Server Actions do módulo financeiro. Todas verificam a sessão (`requireUser`/`requireAdmin`) e
 * validam a entrada com Zod antes de tocar na base de dados — nenhuma confia no que vem do cliente.
 *
 * Estado da integração Stripe: as chaves ainda não estão configuradas (`isStripeConfigured` fica
 * false), por isso `createCheckoutSession` devolve um resultado "mock" em vez de chamar a Stripe a
 * sério. O resto (aplicar desconto, parcelar, marcar pago externamente, fidelização) já é real —
 * não depende da Stripe, só de decisões do admin.
 */

export type FinanceResult = { ok: true } | { ok: false; message: string }

// ─── Checkout (cliente) ─────────────────────────────────────────────────────

const checkoutSchema = z.object({
  invoiceId: z.uuid(),
  /** Vazio = pagar a fatura toda; preenchido = pagar só esta parcela. */
  installmentId: z.union([z.uuid(), z.literal('')]).optional(),
  /**
   * Gerado uma vez no cliente (ex.: `crypto.randomUUID()`) e reenviado sem mudar em caso de nova
   * tentativa (ex.: o utilizador clica "Pagar" duas vezes por engano). A Stripe usa isto para
   * garantir que nunca cria duas sessões de checkout (e duas cobranças) para o mesmo pedido.
   */
  idempotencyKey: z.string().trim().min(10).max(200),
})

export type CheckoutSessionResult = { ok: true; url: string | null; mock: boolean } | { ok: false; message: string }

/**
 * Cria uma sessão de checkout alojada pela Stripe (decisão tomada: página da própria Stripe, não um
 * formulário embutido — mais rápido a implementar, a Stripe trata do PCI-DSS, e já suporta MB WAY e
 * Multibanco sem código extra nosso). Sem chaves configuradas, devolve `mock: true` e `url: null` —
 * a UI mostra isso como "pagamentos online ainda não disponíveis, contacte-nos".
 */
export async function createCheckoutSession(input: unknown): Promise<CheckoutSessionResult> {
  const profile = await requireUser()
  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' }

  const db = createAdminClient()
  const { data: invoice } = await db.from('invoices').select('*').eq('id', parsed.data.invoiceId).eq('client_id', profile.id).maybeSingle()
  if (!invoice) return { ok: false, message: 'Fatura não encontrada.' }
  if (invoice.status === 'pago' || invoice.status === 'cancelado') return { ok: false, message: 'Esta fatura já não aceita pagamento.' }

  let amountEur = invoice.final_amount as number
  let description = invoice.description as string
  const installmentId = parsed.data.installmentId || null

  if (installmentId) {
    const { data: installment } = await db.from('installments').select('*').eq('id', installmentId).eq('invoice_id', invoice.id).maybeSingle()
    if (!installment) return { ok: false, message: 'Parcela não encontrada.' }
    if (installment.status === 'pago') return { ok: false, message: 'Esta parcela já está paga.' }
    amountEur = installment.amount
    description = `${invoice.description} — parcela ${installment.installment_number}`
  }
  if (amountEur <= 0) return { ok: false, message: 'Valor inválido.' }

  if (!isStripeConfigured) {
    return { ok: true, url: null, mock: true }
  }

  // A PARTIR DAQUI é código real de Stripe, ainda por testar contra uma conta a sério — reveja os
  // nomes de campo na documentação atual da Stripe antes de ligar as chaves de produção (a API
  // evolui e este ficheiro foi escrito sem uma conta Stripe disponível para testar).
  try {
    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: STRIPE_PAYMENT_METHODS,
        line_items: [{ price_data: { currency: 'eur', unit_amount: Math.round(amountEur * 100), product_data: { name: description } }, quantity: 1 }],
        // O webhook lê estes metadata para saber que fatura/parcela marcar como paga.
        metadata: { invoiceId: invoice.id, installmentId: installmentId ?? '', clientId: profile.id },
        payment_intent_data: { metadata: { invoiceId: invoice.id, installmentId: installmentId ?? '' } },
        success_url: `${siteUrl}/area-cliente/pagamentos/${invoice.id}?pago=1`,
        cancel_url: `${siteUrl}/area-cliente/pagamentos/${invoice.id}?cancelado=1`,
        customer_email: profile.email,
      },
      { idempotencyKey: parsed.data.idempotencyKey },
    )

    await db.from('payments').insert({ invoice_id: invoice.id, installment_id: installmentId, amount: amountEur, status: 'pendente', stripe_checkout_session_id: session.id })
    return { ok: true, url: session.url, mock: false }
  } catch (error) {
    console.error('[payments] createCheckoutSession:', error)
    return { ok: false, message: 'Não foi possível iniciar o pagamento. Tente novamente ou contacte-nos.' }
  }
}

// ─── Admin: descontos, parcelamento, pagamento externo ─────────────────────

const applyDiscountSchema = z
  .object({
    invoiceId: z.uuid(),
    code: z.string().trim().max(40).optional(),
    manualPercentage: z.coerce.number().min(0).max(100).optional(),
    manualAmount: z.coerce.number().min(0).optional(),
    reason: z.string().trim().max(300).optional(),
  })
  .refine((v) => Boolean(v.code) || v.manualPercentage !== undefined || v.manualAmount !== undefined, { message: 'Indique um código, uma percentagem ou um valor.' })

/** Admin aplica um desconto manual OU por código a uma fatura — recalcula `final_amount` (a base de dados faz a subtração sozinha). */
export async function applyDiscountToInvoice(input: unknown): Promise<FinanceResult> {
  const admin = await requireAdmin()
  const parsed = applyDiscountSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  const { invoiceId, code, manualPercentage, manualAmount, reason } = parsed.data

  const db = createAdminClient()
  const { data: invoice } = await db.from('invoices').select('*').eq('id', invoiceId).maybeSingle()
  if (!invoice) return { ok: false, message: 'Fatura não encontrada.' }
  if (invoice.status === 'pago' || invoice.status === 'cancelado') return { ok: false, message: 'Não é possível aplicar desconto a esta fatura.' }

  let discountAmount = 0
  let discountCodeId: string | null = null

  if (code) {
    const { data: dc } = await db.from('discount_codes').select('*').ilike('code', code.trim()).maybeSingle()
    if (!dc) return { ok: false, message: 'Código não encontrado.' }
    if (!dc.is_active) return { ok: false, message: 'Este código já não está ativo.' }
    if (dc.usage_limit !== null && dc.used_count >= dc.usage_limit) return { ok: false, message: 'Este código atingiu o limite de utilizações.' }
    discountAmount = dc.percentage !== null ? invoice.total_amount * (dc.percentage / 100) : (dc.fixed_amount ?? 0)
    discountCodeId = dc.id
    await db.from('discount_codes').update({ used_count: dc.used_count + 1 }).eq('id', dc.id)
  } else if (manualPercentage !== undefined) {
    discountAmount = invoice.total_amount * (manualPercentage / 100)
  } else if (manualAmount !== undefined) {
    discountAmount = manualAmount
  }
  discountAmount = Math.min(Math.round(discountAmount * 100) / 100, invoice.total_amount)

  const { error } = await db.from('invoices').update({ discount_amount: discountAmount, discount_code_id: discountCodeId, updated_at: new Date().toISOString() }).eq('id', invoiceId)
  if (error) return { ok: false, message: 'Não foi possível aplicar o desconto.' }

  await logAudit({ admin, action: 'APPLY_DISCOUNT', resource: 'financeiro', targetId: invoiceId, details: { code: code ?? null, discountAmount, reason: reason ?? null } })
  revalidatePath('/admin/finance')
  revalidatePath('/area-cliente', 'layout')
  return { ok: true }
}

const extendDueDateSchema = z.object({ invoiceId: z.uuid(), newDueDate: z.iso.date(), reason: z.string().trim().max(300).optional() })

/** Admin estende o prazo de uma fatura ("grace period") — ex.: cortesia por atraso na entrega. Fica sempre auditado com o motivo. */
export async function extendDueDate(input: unknown): Promise<FinanceResult> {
  const admin = await requireAdmin()
  const parsed = extendDueDateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Data inválida.' }

  const db = createAdminClient()
  const { data: invoice } = await db.from('invoices').select('*').eq('id', parsed.data.invoiceId).maybeSingle()
  if (!invoice) return { ok: false, message: 'Fatura não encontrada.' }
  if (invoice.status === 'pago' || invoice.status === 'cancelado') return { ok: false, message: 'Não é possível alterar o vencimento desta fatura.' }

  const { error } = await db.from('invoices').update({ due_date: parsed.data.newDueDate, status: 'pendente', updated_at: new Date().toISOString() }).eq('id', invoice.id)
  if (error) return { ok: false, message: 'Não foi possível alterar o vencimento.' }

  await logAudit({ admin, action: 'EXTEND_DUE_DATE', resource: 'financeiro', targetId: invoice.id, details: { from: invoice.due_date, to: parsed.data.newDueDate, reason: parsed.data.reason ?? null } })
  revalidatePath('/admin/finance')
  revalidatePath('/area-cliente', 'layout')
  return { ok: true }
}

const convertSchema = z.object({ invoiceId: z.uuid(), numberOfInstallments: z.coerce.number().int().min(2, 'Mínimo de 2 parcelas.').max(12, 'Máximo de 12 parcelas.') })

/** Admin divide uma fatura "Único" em N parcelas mensais — a 1ª leva o cêntimo de arredondamento, para a soma bater sempre certo. */
export async function convertToInstallments(input: unknown): Promise<FinanceResult> {
  const admin = await requireAdmin()
  const parsed = convertSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const db = createAdminClient()
  const { data: invoice } = await db.from('invoices').select('*').eq('id', parsed.data.invoiceId).maybeSingle()
  if (!invoice) return { ok: false, message: 'Fatura não encontrada.' }
  if (invoice.payment_type === 'parcelado') return { ok: false, message: 'Esta fatura já está parcelada.' }
  if (invoice.status === 'pago' || invoice.status === 'cancelado') return { ok: false, message: 'Não é possível parcelar esta fatura.' }

  const n = parsed.data.numberOfInstallments
  const rows = buildInstallmentRows(invoice.final_amount, n, invoice.due_date).map((r) => ({ ...r, invoice_id: invoice.id }))

  const { error: insertError } = await db.from('installments').insert(rows)
  if (insertError) return { ok: false, message: 'Não foi possível criar as parcelas.' }
  await db.from('invoices').update({ payment_type: 'parcelado', updated_at: new Date().toISOString() }).eq('id', invoice.id)

  await logAudit({ admin, action: 'CONVERT_TO_INSTALLMENTS', resource: 'financeiro', targetId: invoice.id, details: { numberOfInstallments: n } })
  revalidatePath('/admin/finance')
  revalidatePath('/area-cliente', 'layout')
  return { ok: true }
}

const SELF_SERVICE_INSTALLMENTS = 3
const requestPlanSchema = z.object({ invoiceId: z.uuid() })

/**
 * O próprio cliente pede para parcelar em 3x sem juros — sem enviar email, sem esperar pela equipa
 * (é essa a fricção que o botão "Parcelar em 3x" no portal existe para remover). Diferente de
 * `convertToInstallments`: aqui o número de parcelas é sempre 3 (a oferta que o negócio já decidiu
 * dar), não um valor livre — por isso pode ser self-service em vez de exigir `requireAdmin`. Escreve
 * pela mesma fórmula de `buildInstallmentRows`, fica auditado, e é sempre revertível pelo admin.
 */
export async function requestInstallmentPlan(input: unknown): Promise<FinanceResult> {
  const profile = await requireUser()
  const parsed = requestPlanSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' }

  const db = createAdminClient()
  const { data: invoice } = await db.from('invoices').select('*').eq('id', parsed.data.invoiceId).eq('client_id', profile.id).maybeSingle()
  if (!invoice) return { ok: false, message: 'Fatura não encontrada.' }
  if (invoice.payment_type === 'parcelado') return { ok: false, message: 'Esta fatura já está parcelada.' }
  if (invoice.status !== 'pendente') return { ok: false, message: 'Só é possível parcelar faturas pendentes.' }

  const rows = buildInstallmentRows(invoice.final_amount, SELF_SERVICE_INSTALLMENTS, invoice.due_date).map((r) => ({ ...r, invoice_id: invoice.id }))
  const { error: insertError } = await db.from('installments').insert(rows)
  if (insertError) return { ok: false, message: 'Não foi possível criar o parcelamento.' }
  await db.from('invoices').update({ payment_type: 'parcelado', updated_at: new Date().toISOString() }).eq('id', invoice.id)

  await logAudit({
    admin: { id: profile.id, email: profile.email },
    action: 'CONVERT_TO_INSTALLMENTS',
    resource: 'financeiro',
    targetId: invoice.id,
    details: { numberOfInstallments: SELF_SERVICE_INSTALLMENTS, selfService: true },
  })
  revalidatePath('/area-cliente', 'layout')
  return { ok: true }
}

const markPaidSchema = z.object({ invoiceId: z.uuid(), installmentId: z.union([z.uuid(), z.literal('')]).optional(), method: z.string().trim().min(2, 'Indique o método (ex.: transferência).').max(60) })

/**
 * Admin marca uma fatura (ou uma parcela) como paga fora da Stripe — transferência bancária, ao
 * balcão, etc. Idempotente por construção: se já houver um pagamento "sucesso" para este alvo, não
 * duplica nada (não precisa de `idempotencyKey`, ao contrário do checkout — aqui não há retentativa
 * de rede a proteger, só um clique duplo do admin, e essa verificação já chega).
 */
export async function markInvoicePaidExternally(input: unknown): Promise<FinanceResult> {
  const admin = await requireAdmin()
  const parsed = markPaidSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  const installmentId = parsed.data.installmentId || null

  const db = createAdminClient()
  const { data: invoice } = await db.from('invoices').select('*').eq('id', parsed.data.invoiceId).maybeSingle()
  if (!invoice) return { ok: false, message: 'Fatura não encontrada.' }

  const now = new Date().toISOString()
  let settledAmount = invoice.final_amount as number

  if (installmentId) {
    const { data: installment } = await db.from('installments').select('*').eq('id', installmentId).eq('invoice_id', invoice.id).maybeSingle()
    if (!installment) return { ok: false, message: 'Parcela não encontrada.' }
    if (installment.status === 'pago') return { ok: true } // já estava marcada — sem duplicar
    settledAmount = installment.amount
    await db.from('installments').update({ status: 'pago' }).eq('id', installment.id)
    const { data: remaining } = await db.from('installments').select('id').eq('invoice_id', invoice.id).neq('status', 'pago')
    if (!remaining || remaining.length === 0) await db.from('invoices').update({ status: 'pago', updated_at: now }).eq('id', invoice.id)
  } else {
    if (invoice.status === 'pago') return { ok: true } // já estava marcada — sem duplicar
    await db.from('invoices').update({ status: 'pago', updated_at: now }).eq('id', invoice.id)
  }

  await db.from('payments').insert({ invoice_id: invoice.id, installment_id: installmentId, amount: settledAmount, status: 'sucesso', payment_method: parsed.data.method, paid_at: now })
  await recordPaymentForLoyalty(db, invoice.client_id, settledAmount)

  await logAudit({ admin, action: 'MARK_INVOICE_PAID_EXTERNALLY', resource: 'financeiro', targetId: invoice.id, details: { method: parsed.data.method, amount: settledAmount, installmentId } })
  revalidatePath('/admin/finance')
  revalidatePath('/area-cliente', 'layout')
  return { ok: true }
}

// ─── Admin: retenção (códigos de desconto e pontos de fidelização) ─────────

const createCodeSchema = z
  .object({
    code: z.string().trim().min(3).max(40),
    percentage: z.union([z.coerce.number().min(1).max(100), z.literal('')]).optional(),
    fixedAmount: z.union([z.coerce.number().min(0.01), z.literal('')]).optional(),
    usageLimit: z.union([z.coerce.number().int().min(1), z.literal('')]).optional(),
  })
  .refine((v) => (typeof v.percentage === 'number') !== (typeof v.fixedAmount === 'number'), { message: 'Indique ou uma percentagem, ou um valor fixo — nunca os dois.' })

export async function createDiscountCode(input: unknown): Promise<FinanceResult> {
  const admin = await requireAdmin()
  const parsed = createCodeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const db = createAdminClient()
  const { error } = await db.from('discount_codes').insert({
    code: parsed.data.code.toUpperCase(),
    percentage: typeof parsed.data.percentage === 'number' ? parsed.data.percentage : null,
    fixed_amount: typeof parsed.data.fixedAmount === 'number' ? parsed.data.fixedAmount : null,
    usage_limit: typeof parsed.data.usageLimit === 'number' ? parsed.data.usageLimit : null,
  })
  if (error) return { ok: false, message: error.code === '23505' ? 'Já existe um código com esse nome.' : 'Não foi possível criar o código.' }

  await logAudit({ admin, action: 'CREATE_DISCOUNT_CODE', resource: 'financeiro', details: { code: parsed.data.code } })
  revalidatePath('/admin/finance')
  return { ok: true }
}

const addPointsSchema = z.object({ clientId: z.uuid(), points: z.coerce.number().int().min(1).max(100_000), reason: z.string().trim().min(3, 'Explique o motivo (fica registado na auditoria).').max(300) })

/** Admin oferece pontos de bónus manualmente (ex.: compensação, fidelização ativa) — fica sempre com motivo auditável. */
export async function addLoyaltyPoints(input: unknown): Promise<FinanceResult> {
  const admin = await requireAdmin()
  const parsed = addPointsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const db = createAdminClient()
  const { data: current } = await db.from('client_loyalty').select('*').eq('client_id', parsed.data.clientId).maybeSingle()
  const loyaltyPoints = (current?.loyalty_points ?? 0) + parsed.data.points
  const totalSpent = current?.total_spent ?? 0
  const { error } = await db
    .from('client_loyalty')
    .upsert({ client_id: parsed.data.clientId, loyalty_points: loyaltyPoints, total_spent: totalSpent, loyalty_tier: current?.loyalty_tier ?? tierForSpend(totalSpent), updated_at: new Date().toISOString() })
  if (error) return { ok: false, message: 'Não foi possível atribuir os pontos.' }

  await logAudit({ admin, action: 'ADD_LOYALTY_POINTS', resource: 'financeiro', targetId: parsed.data.clientId, details: { points: parsed.data.points, reason: parsed.data.reason } })
  revalidatePath('/admin/finance')
  revalidatePath('/area-cliente', 'layout')
  return { ok: true }
}
