import 'server-only'
import { buildInstallmentRows } from '@/lib/finance/installments'
import type { createAdminClient } from '@/lib/supabase/server'
import type { PaymentType } from '@/types/finance'

/**
 * Cria a fatura (e, se parcelado, as parcelas) para um negócio fechado como Ganho — partilhado entre
 * `markDealWon` (cliente já associado nesse momento) e `linkLeadToClient` (associado mais tarde).
 * Só pode correr quando o negócio já tem uma conta de cliente associada (a fatura exige `client_id`).
 */
export async function createInvoiceForDeal(
  db: ReturnType<typeof createAdminClient>,
  args: { clientId: string; description: string; amount: number; paymentType: PaymentType; installments: number | null; dueDate: string },
): Promise<{ invoiceId: string } | { error: string }> {
  const { data: invoice, error } = await db
    .from('invoices')
    .insert({ client_id: args.clientId, description: args.description, total_amount: args.amount, status: 'pendente', due_date: args.dueDate, payment_type: args.paymentType })
    .select('id')
    .single()
  if (error || !invoice) return { error: error?.message ?? 'Não foi possível criar a fatura.' }

  if (args.paymentType === 'parcelado' && args.installments) {
    const rows = buildInstallmentRows(args.amount, args.installments, args.dueDate).map((r) => ({ ...r, invoice_id: invoice.id }))
    const { error: installmentsError } = await db.from('installments').insert(rows)
    if (installmentsError) return { error: installmentsError.message }
  }

  return { invoiceId: invoice.id }
}
