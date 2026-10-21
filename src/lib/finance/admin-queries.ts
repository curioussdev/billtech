import 'server-only'
import { mockDiscountCodes, mockFinanceClients, mockInstallments, mockInvoices, mockPayments } from '@/data/mock/finance'
import { type InstallmentRow, type LoyaltyRow, type PaymentRow, mapInstallment, mapInvoice, mapLoyalty, mapPayment } from '@/lib/finance/mappers'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createAdminClient } from '@/lib/supabase/server'
import type { ClientFinanceSummary, ClientLoyalty, DiscountCode, Expense, InvoiceWithDetails, Payment } from '@/types/finance'

/**
 * Leitura do módulo financeiro, do lado do admin (`/admin/finance`). Sem Supabase configurado (ou
 * sem a service role key), cai nos dados de demonstração para a UI não ficar em branco em dev local;
 * com a base de dados ligada, mostra sempre os dados reais — incluindo quando ainda não há nenhuma
 * fatura. Os IDs de cliente mock começam sempre por "fc-", nunca colidem com um UUID real.
 */
const isLive = () => isSupabaseConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
const isMockClientId = (id: string) => id.startsWith('fc-')

export type AdminInvoice = InvoiceWithDetails & { clientName: string; clientEmail: string; clientCompany: string }

function mockAdminInvoices(): AdminInvoice[] {
  const clientMap = new Map(mockFinanceClients.map((c) => [c.id, c]))
  return mockInvoices.map((invoice) => {
    const client = clientMap.get(invoice.clientId)
    return {
      ...invoice,
      installments: mockInstallments.filter((i) => i.invoiceId === invoice.id),
      payments: mockPayments.filter((p) => p.invoiceId === invoice.id),
      clientName: client?.name ?? 'Cliente',
      clientEmail: client?.email ?? '',
      clientCompany: client?.company ?? '',
    }
  })
}

/** Todas as faturas, com o nome do cliente já resolvido — a tabela do admin lê diretamente daqui. */
export async function listAllInvoices(): Promise<AdminInvoice[]> {
  if (!isLive()) return mockAdminInvoices()

  try {
    const db = createAdminClient()
    const [{ data: invoiceRows, error }, { data: installmentRows }, { data: paymentRows }] = await Promise.all([
      db.from('invoices').select('*').order('due_date', { ascending: true }),
      db.from('installments').select('*').order('installment_number', { ascending: true }),
      db.from('payments').select('*').order('created_at', { ascending: false }),
    ])
    if (error) throw error
    const rows = invoiceRows ?? []

    const clientIds = [...new Set(rows.map((r) => r.client_id as string))]
    const { data: profiles } = await db.from('profiles').select('id, full_name, email, company').in('id', clientIds)
    const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p]))

    const installments = ((installmentRows ?? []) as InstallmentRow[]).map(mapInstallment)
    const payments = ((paymentRows ?? []) as PaymentRow[]).map(mapPayment)

    return rows.map((row) => {
      const invoice = mapInvoice(row)
      const profile = profileMap.get(row.client_id as string)
      return {
        ...invoice,
        installments: installments.filter((i) => i.invoiceId === invoice.id),
        payments: payments.filter((p) => p.invoiceId === invoice.id),
        clientName: profile?.full_name || profile?.email || 'Cliente',
        clientEmail: profile?.email ?? '',
        clientCompany: profile?.company ?? '',
      }
    })
  } catch (error) {
    console.error('[finance] leitura de invoices (admin) falhou; a usar dados de demonstração:', error)
    return mockAdminInvoices()
  }
}

export async function getInvoiceAdmin(id: string): Promise<AdminInvoice | null> {
  const all = await listAllInvoices()
  return all.find((i) => i.id === id) ?? null
}

/** Fatura mais recente de um cliente — usada só como pré-preenchimento de conveniência (ex.: ao gerar um contrato), nunca como fonte de verdade aplicada sem confirmação. */
export async function getMostRecentInvoiceForClient(clientId: string): Promise<AdminInvoice | null> {
  const all = await listAllInvoices()
  const clientInvoices = all.filter((i) => i.clientId === clientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return clientInvoices[0] ?? null
}

export type AdminPayment = Payment & { clientId: string; clientName: string; clientCompany: string; invoiceDescription: string; registeredByEmail: string | null }

/**
 * Todos os pagamentos com sucesso, de todas as faturas, com o cliente/fatura já resolvidos — achata
 * os `payments` que `listAllInvoices()` já carrega (sem query nova). Alimenta a secção "Pagamentos
 * registados" do admin: visão CRM do que já foi recebido fora da plataforma, por quem e de quem.
 */
export async function listAllPayments(): Promise<AdminPayment[]> {
  const invoices = await listAllInvoices()
  const flattened = invoices.flatMap((invoice) =>
    invoice.payments
      .filter((p) => p.status === 'sucesso')
      .map((p) => ({ ...p, clientId: invoice.clientId, clientName: invoice.clientName, clientCompany: invoice.clientCompany, invoiceDescription: invoice.description })),
  )

  if (!isLive() || flattened.length === 0) return flattened.map((p) => ({ ...p, registeredByEmail: null }))

  const adminIds = [...new Set(flattened.map((p) => p.registeredBy).filter((id): id is string => Boolean(id)))]
  const emailMap = new Map<string, string>()
  if (adminIds.length > 0) {
    try {
      const { data } = await createAdminClient().from('profiles').select('id, email').in('id', adminIds)
      for (const row of data ?? []) emailMap.set(row.id as string, row.email as string)
    } catch (error) {
      console.error('[finance] leitura de emails de admins (registered_by) falhou:', error)
    }
  }

  return flattened.map((p) => ({ ...p, registeredByEmail: p.registeredBy ? (emailMap.get(p.registeredBy) ?? null) : null })).sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? ''))
}

/** Clientes ordenados por total gasto — a secção de fidelização/retenção. */
export async function listFinanceSummary(): Promise<ClientFinanceSummary[]> {
  const invoices = await listAllInvoices()
  const byClient = new Map<string, AdminInvoice[]>()
  for (const inv of invoices) byClient.set(inv.clientId, [...(byClient.get(inv.clientId) ?? []), inv])

  const clientIds = [...byClient.keys()]
  const realIds = clientIds.filter((id) => !isMockClientId(id))
  const loyaltyMap = new Map<string, ClientLoyalty>()

  if (isLive() && realIds.length > 0) {
    try {
      const db = createAdminClient()
      const { data } = await db.from('client_loyalty').select('*').in('client_id', realIds)
      for (const row of (data ?? []) as LoyaltyRow[]) loyaltyMap.set(row.client_id, mapLoyalty(row))
    } catch (error) {
      console.error('[finance] leitura de client_loyalty (admin) falhou:', error)
    }
  }

  return clientIds
    .map((clientId) => {
      const clientInvoices = byClient.get(clientId)!
      const first = clientInvoices[0]
      const loyalty = loyaltyMap.get(clientId) ?? { clientId, loyaltyPoints: 0, loyaltyTier: 'bronze' as const, totalSpent: 0, updatedAt: new Date().toISOString() }
      return {
        clientId,
        clientName: first.clientName,
        clientEmail: first.clientEmail,
        company: first.clientCompany,
        loyalty,
        invoiceCount: clientInvoices.length,
        openAmount: clientInvoices.filter((i) => i.status === 'pendente' || i.status === 'atrasado').reduce((a, i) => a + i.finalAmount, 0),
        overdueCount: clientInvoices.filter((i) => i.status === 'atrasado').length,
      }
    })
    .sort((a, b) => b.loyalty.totalSpent - a.loyalty.totalSpent)
}

/** Todos os clientes reais com conta no portal — para o seletor "enviar pontos a" incluir quem ainda não tem fatura nenhuma. */
export async function listPortalClients(): Promise<{ id: string; name: string; email: string }[]> {
  if (!isLive()) return mockFinanceClients.map((c) => ({ id: c.id, name: c.company, email: c.email }))
  try {
    const db = createAdminClient()
    const { data } = await db.from('profiles').select('id, full_name, email, company').eq('role', 'client').order('company', { ascending: true })
    return (data ?? []).map((p) => ({ id: p.id as string, name: (p.company as string) || (p.full_name as string) || (p.email as string), email: p.email as string }))
  } catch (error) {
    console.error('[finance] leitura de clientes do portal falhou:', error)
    return mockFinanceClients.map((c) => ({ id: c.id, name: c.company, email: c.email }))
  }
}

export async function listDiscountCodes(): Promise<DiscountCode[]> {
  if (!isLive()) return mockDiscountCodes
  try {
    const db = createAdminClient()
    const { data, error } = await db.from('discount_codes').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => ({
      id: r.id,
      code: r.code,
      percentage: r.percentage,
      fixedAmount: r.fixed_amount,
      isActive: r.is_active,
      usageLimit: r.usage_limit,
      usedCount: r.used_count,
      createdAt: r.created_at,
    }))
  } catch (error) {
    console.error('[finance] leitura de discount_codes falhou; a usar dados de demonstração:', error)
    return mockDiscountCodes
  }
}

/** Despesas do negócio, para o ledger unificado. Sem dados de demonstração — é uma tabela nova, sem histórico fictício a simular. */
export async function listExpenses(): Promise<Expense[]> {
  if (!isLive()) return []
  try {
    const db = createAdminClient()
    const { data, error } = await db.from('expenses').select('*').order('incurred_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => ({ id: r.id, description: r.description, amount: r.amount, category: r.category, incurredAt: r.incurred_at, createdAt: r.created_at }))
  } catch (error) {
    console.error('[finance] leitura de expenses falhou:', error)
    return []
  }
}
