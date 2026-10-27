import 'server-only'
import { type AutopayMandateRow, type InstallmentRow, type InvoiceRow, type LoyaltyRow, type PaymentRow, mapAutopayMandate, mapInstallment, mapInvoice, mapLoyalty, mapPayment } from '@/lib/finance/mappers'
import { getStripeClient, isStripeConfigured } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import type { AutopayMandate, ClientLoyalty, Invoice, InvoiceWithDetails } from '@/types/finance'

/**
 * Leitura do módulo financeiro, do lado do cliente (área de cliente). Usa sempre o cliente com
 * sessão (`createClient`, respeita RLS) — nunca a service role: um cliente só pode ver as suas
 * próprias faturas, por construção da política, não por filtro aplicado aqui.
 *
 * Sem fallback para os dados de demonstração: ao contrário do CRM (onde os mocks preenchem um
 * dashboard interno ainda vazio), mostrar dados fictícios a um cliente real autenticado seria
 * enganador. "Sem faturas" é um estado legítimo, não um vazio a disfarçar. (O admin, em
 * `admin-queries.ts`, já segue o padrão inverso — mock só quando a tabela real está vazia.)
 */

/** Faturas em aberto primeiro (mais próximas do vencimento), depois as resolvidas (mais recentes primeiro). */
function sortInvoices(invoices: Invoice[]): Invoice[] {
  const open = (s: Invoice['status']) => s === 'pendente' || s === 'atrasado'
  return [...invoices].sort((a, b) => {
    if (open(a.status) !== open(b.status)) return open(a.status) ? -1 : 1
    return open(a.status) ? a.dueDate.localeCompare(b.dueDate) : b.updatedAt.localeCompare(a.updatedAt)
  })
}

export async function getMyInvoices(): Promise<InvoiceWithDetails[]> {
  const supabase = await createClient()
  const [{ data: invoiceRows }, { data: installmentRows }, { data: paymentRows }] = await Promise.all([
    supabase.from('invoices').select('*'),
    supabase.from('installments').select('*').order('installment_number', { ascending: true }),
    supabase.from('payments').select('*').order('created_at', { ascending: false }),
  ])

  const invoices = sortInvoices(((invoiceRows ?? []) as InvoiceRow[]).map(mapInvoice))
  const installments = ((installmentRows ?? []) as InstallmentRow[]).map(mapInstallment)
  const payments = ((paymentRows ?? []) as PaymentRow[]).map(mapPayment)

  return invoices.map((invoice) => ({
    ...invoice,
    installments: installments.filter((i) => i.invoiceId === invoice.id),
    payments: payments.filter((p) => p.invoiceId === invoice.id),
  }))
}

export async function getMyInvoice(id: string): Promise<InvoiceWithDetails | null> {
  const supabase = await createClient()
  const { data: invoiceRow } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle()
  if (!invoiceRow) return null

  const [{ data: installmentRows }, { data: paymentRows }] = await Promise.all([
    supabase.from('installments').select('*').eq('invoice_id', id).order('installment_number', { ascending: true }),
    supabase.from('payments').select('*').eq('invoice_id', id).order('created_at', { ascending: false }),
  ])

  return {
    ...mapInvoice(invoiceRow as InvoiceRow),
    installments: ((installmentRows ?? []) as InstallmentRow[]).map(mapInstallment),
    payments: ((paymentRows ?? []) as PaymentRow[]).map(mapPayment),
  }
}

export async function getMyLoyalty(): Promise<ClientLoyalty | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('client_loyalty').select('*').maybeSingle()
  return data ? mapLoyalty(data as LoyaltyRow) : null
}

export type AutopayDisplay = { mandate: AutopayMandate; label: string }

/**
 * O método de débito automático ativo do cliente (se tiver), com uma etiqueta amigável para mostrar
 * (ex. "Cartão •••• 4242" ou "Débito direto •••• PT50"). A etiqueta vem sempre em direto da Stripe
 * (`paymentMethods.retrieve`) — a BillTech nunca guarda número de cartão nem IBAN, só a referência.
 */
export async function getMyAutopayMandate(): Promise<AutopayDisplay | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('autopay_mandates').select('*').eq('status', 'ativo').maybeSingle()
  if (!data) return null
  const mandate = mapAutopayMandate(data as AutopayMandateRow)

  let label = mandate.methodType === 'card' ? 'Cartão' : 'Débito direto (IBAN)'
  if (isStripeConfigured) {
    try {
      const pm = await getStripeClient().paymentMethods.retrieve(mandate.stripePaymentMethodId)
      if (pm.card) label = `Cartão •••• ${pm.card.last4}`
      else if (pm.sepa_debit) label = `Débito direto •••• ${pm.sepa_debit.last4}`
    } catch (error) {
      console.error('[finance] leitura do método de pagamento na Stripe falhou:', error)
    }
  }
  return { mandate, label }
}
