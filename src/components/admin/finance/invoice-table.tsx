'use client'

import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import { InvoiceManageDialog } from '@/components/admin/finance/invoice-manage-dialog'
import { InvoiceStatusBadge } from '@/components/portal/invoice-widgets'
import { Button } from '@/components/ui/button'
import type { AdminInvoice } from '@/lib/finance/admin-queries'
import { formatDate, formatEUR, paymentTypeLabels } from '@/lib/finance/labels'

/** Tabela de faturas do admin — filtros e ordenação já vêm feitos do servidor (searchParams); aqui só fica o botão "Gerir" por linha, que precisa de estado local (o dialog aberto). */
export function InvoiceTable({ invoices }: { invoices: AdminInvoice[] }) {
  const [managing, setManaging] = useState<AdminInvoice | null>(null)

  if (invoices.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border p-8 text-muted-foreground">Nenhuma fatura corresponde aos filtros escolhidos.</p>
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[960px] text-left text-sm">
          <caption className="sr-only">Faturas de todos os clientes</caption>
          <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">Cliente</th>
              <th scope="col" className="px-4 py-3">Descrição</th>
              <th scope="col" className="px-4 py-3 text-right">Total</th>
              <th scope="col" className="px-4 py-3 text-right">Desconto</th>
              <th scope="col" className="px-4 py-3 text-right">Final</th>
              <th scope="col" className="px-4 py-3">Vencimento</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <span className="block font-medium">{invoice.clientCompany || invoice.clientName}</span>
                  <span className="block text-xs text-muted-foreground">{invoice.clientName}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="block max-w-xs truncate">{invoice.description}</span>
                  <span className="text-xs text-muted-foreground">{paymentTypeLabels[invoice.paymentType]}</span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatEUR(invoice.totalAmount)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{invoice.discountAmount > 0 ? `− ${formatEUR(invoice.discountAmount)}` : '—'}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatEUR(invoice.finalAmount)}</td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatDate(invoice.dueDate)}</td>
                <td className="px-4 py-3">
                  <InvoiceStatusBadge status={invoice.status} />
                </td>
                <td className="px-4 py-3">
                  <Button type="button" size="sm" variant="outline" onClick={() => setManaging(invoice)}>
                    <Settings2 aria-hidden /> Gerir
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {managing && <InvoiceManageDialog invoice={managing} open={Boolean(managing)} onOpenChange={(v) => !v && setManaging(null)} />}
    </>
  )
}
