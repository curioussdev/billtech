import 'server-only'
import { type AutopayMandateRow, mapAutopayMandate } from '@/lib/finance/mappers'
import { listAllInvoices } from '@/lib/finance/admin-queries'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createAdminClient } from '@/lib/supabase/server'
import type { AutopayMandate } from '@/types/finance'

/** Leitura do débito automático, do lado do admin (`/admin/finance`). Separado de `admin-queries.ts` para esse ficheiro não crescer sem necessidade. */
const isLive = () => isSupabaseConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

export interface AutopayDueItem {
  invoiceId: string
  installmentId: string | null
  description: string
  amount: number
  dueDate: string
}

export interface AutopayFailure {
  paymentId: string
  invoiceId: string
  description: string
  amount: number
  notes: string
  createdAt: string
}

export interface AutopayOverviewRow {
  clientId: string
  clientName: string
  clientEmail: string
  mandate: AutopayMandate
  /** Todas as parcelas/faturas em aberto com autopay ativo, por vencimento — cada uma pode ser cobrada manualmente a qualquer momento, não só a mais próxima. */
  payable: AutopayDueItem[]
  /** Parcelas/faturas a vencer nos próximos dias (não hoje, não atrasadas — essas já estão em `nextDue`) — candidatas a um aviso prévio antes de serem cobradas. SEPA Direct Debit exige pré-aviso por lei; cartão não, mas avisar não faz mal. */
  upcomingNotices: AutopayDueItem[]
  recentFailures: AutopayFailure[]
  /** Todos os mandatos deste cliente, incluindo os já revogados antes do atual — mais recente primeiro, inclui `mandate`. Só consulta, sem ação associada. */
  history: AutopayMandate[]
}

const NOTICE_WINDOW_DAYS = 5

/**
 * Visão geral para o admin: quem tem débito automático ativo, o que vem a seguir para cobrar, e
 * falhas recentes a precisar de atenção. Sem base de dados real, mostra uma lista vazia — débito
 * automático não faz parte da história de demonstração (nenhum pagamento Stripe mock existe hoje).
 */
export async function listAutopayOverview(): Promise<AutopayOverviewRow[]> {
  if (!isLive()) return []

  try {
    const db = createAdminClient()
    const [{ data: mandateRows, error }, invoices] = await Promise.all([db.from('autopay_mandates').select('*').eq('status', 'ativo'), listAllInvoices()])
    if (error) throw error
    const mandates = ((mandateRows ?? []) as AutopayMandateRow[]).map(mapAutopayMandate)
    if (mandates.length === 0) return []

    const clientIds = mandates.map((m) => m.clientId)
    const [{ data: profiles }, { data: failureRows }, { data: historyRows }] = await Promise.all([
      db.from('profiles').select('id, full_name, email').in('id', clientIds),
      db.from('payments').select('id, invoice_id, amount, notes, created_at').eq('payment_method', 'autopay').eq('status', 'falhou').order('created_at', { ascending: false }).limit(100),
      db.from('autopay_mandates').select('*').in('client_id', clientIds).order('created_at', { ascending: false }),
    ])
    const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p]))
    const allMandates = ((historyRows ?? []) as AutopayMandateRow[]).map(mapAutopayMandate)
    const today = new Date().toISOString().slice(0, 10)
    const noticeEnd = new Date(Date.now() + NOTICE_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10)

    return mandates.map((mandate) => {
      const profile = profileMap.get(mandate.clientId)
      const clientInvoices = invoices.filter((inv) => inv.clientId === mandate.clientId && inv.autopayEnabled && inv.status !== 'pago' && inv.status !== 'cancelado')

      const payableItems: AutopayDueItem[] = clientInvoices.flatMap((inv): AutopayDueItem[] =>
        inv.paymentType === 'parcelado'
          ? inv.installments.filter((i) => i.status !== 'pago').map((i) => ({ invoiceId: inv.id, installmentId: i.id, description: inv.description, amount: i.amount, dueDate: i.dueDate }))
          : [{ invoiceId: inv.id, installmentId: null, description: inv.description, amount: inv.finalAmount, dueDate: inv.dueDate }],
      )
      const sorted = [...payableItems].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      const upcomingNotices = sorted.filter((item) => item.dueDate > today && item.dueDate <= noticeEnd)

      const recentFailures: AutopayFailure[] = (failureRows ?? [])
        .filter((f) => clientInvoices.some((inv) => inv.id === f.invoice_id))
        .map((f) => ({
          paymentId: f.id as string,
          invoiceId: f.invoice_id as string,
          description: clientInvoices.find((inv) => inv.id === f.invoice_id)?.description ?? '',
          amount: f.amount as number,
          notes: (f.notes as string) ?? '',
          createdAt: f.created_at as string,
        }))

      const history = allMandates.filter((m) => m.clientId === mandate.clientId)

      return { clientId: mandate.clientId, clientName: profile?.full_name || profile?.email || 'Cliente', clientEmail: profile?.email ?? '', mandate, payable: sorted, upcomingNotices, recentFailures, history }
    })
  } catch (error) {
    console.error('[finance] leitura de autopay_mandates falhou:', error)
    return []
  }
}
