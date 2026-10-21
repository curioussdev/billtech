'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Undo2 } from 'lucide-react'
import { undoPayment } from '@/actions/payments'
import { Button } from '@/components/ui/button'
import type { AdminPayment } from '@/lib/finance/admin-queries'
import { formatDate, formatEUR } from '@/lib/finance/labels'

/** Linha com o botão "Desfazer" — estado local de pendente/erro, isolado por pagamento. */
function UndoButton({ payment }: { payment: AdminPayment }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handle() {
    const label = `${formatEUR(payment.amount)} · ${payment.clientCompany || payment.clientName} · ${payment.invoiceDescription}`
    if (!window.confirm(`Desfazer este pagamento?\n\n${label}\n\nUse isto só quando o pagamento foi registado por engano (nunca chegou a acontecer) — não é a forma certa de registar um reembolso de dinheiro que foi mesmo recebido.`)) return
    setPending(true)
    setError(null)
    const result = await undoPayment({ paymentId: payment.id })
    setPending(false)
    if (!result.ok) return setError(result.message)
    router.refresh()
  }

  return (
    <div className="grid justify-items-end gap-1">
      <Button type="button" size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" disabled={pending} onClick={handle}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Undo2 className="size-4" aria-hidden />} Desfazer
      </Button>
      {error && <p role="alert" className="max-w-[12rem] text-right text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}

/**
 * Tudo o que já foi recebido, de todas as faturas — visão CRM: quando, de quem, quanto, por que
 * método e por que admin foi registado (sem Stripe ativo, estes são sempre pagamentos feitos fora
 * da plataforma). Corrigir o VALOR ou o MÉTODO de um registo continua a ser pela fatura
 * (`InvoiceManageDialog`) — aqui só existe para desfazer um registo feito por engano.
 */
export function PaymentsTable({ payments }: { payments: AdminPayment[] }) {
  if (payments.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border p-8 text-muted-foreground">Ainda sem pagamentos registados.</p>
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[960px] text-left text-sm">
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
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Ações</span>
            </th>
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
              <td className="px-4 py-3">
                <span className="block">{p.paymentMethod || '—'}</span>
                {p.notes && <span className="block max-w-[14rem] truncate text-xs text-muted-foreground" title={p.notes}>{p.notes}</span>}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{p.installmentId ? 'Parcela' : 'Fatura toda'}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.registeredByEmail ?? 'Cliente (online)'}</td>
              <td className="px-4 py-3">
                <UndoButton payment={p} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
