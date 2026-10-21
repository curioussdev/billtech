import type { AdminPayment } from '@/lib/finance/admin-queries'
import { formatDate, formatEUR } from '@/lib/finance/labels'

/**
 * Tudo o que já foi recebido, de todas as faturas — visão CRM só de leitura: quando, de quem, quanto,
 * por que método e por que admin foi registado (sem Stripe ativo, estes são sempre pagamentos feitos
 * fora da plataforma). Corrigir um registo é sempre pela fatura (`InvoiceManageDialog`), nunca aqui.
 */
export function PaymentsTable({ payments }: { payments: AdminPayment[] }) {
  if (payments.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border p-8 text-muted-foreground">Ainda sem pagamentos registados.</p>
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[860px] text-left text-sm">
        <caption className="sr-only">Pagamentos registados, de todos os clientes</caption>
        <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">Data</th>
            <th scope="col" className="px-4 py-3">Cliente</th>
            <th scope="col" className="px-4 py-3">Fatura</th>
            <th scope="col" className="px-4 py-3 text-right">Valor</th>
            <th scope="col" className="px-4 py-3">Método</th>
            <th scope="col" className="px-4 py-3">Parcela</th>
            <th scope="col" className="px-4 py-3">Registado por</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {payments.map((p) => (
            <tr key={p.id} className="hover:bg-muted/40">
              <td className="whitespace-nowrap px-4 py-3 tabular-nums">{p.paidAt ? formatDate(p.paidAt) : '—'}</td>
              <td className="px-4 py-3">
                <span className="block font-medium">{p.clientCompany || p.clientName}</span>
                <span className="block text-xs text-muted-foreground">{p.clientName}</span>
              </td>
              <td className="px-4 py-3">
                <span className="block max-w-xs truncate">{p.invoiceDescription}</span>
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatEUR(p.amount)}</td>
              <td className="px-4 py-3">{p.paymentMethod || '—'}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.installmentId ? 'Parcela' : 'Fatura toda'}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.registeredByEmail ?? 'Cliente (online)'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
