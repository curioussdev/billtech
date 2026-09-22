import type { Metadata } from 'next'
import { InvoiceListItem } from '@/components/portal/invoice-widgets'
import { getMyInvoices } from '@/lib/finance/queries'

export const metadata: Metadata = { title: 'Faturas' }

export default async function PortalInvoicesPage() {
  const invoices = await getMyInvoices()
  const open = invoices.filter((i) => i.status === 'pendente' || i.status === 'atrasado')
  const history = invoices.filter((i) => i.status === 'pago' || i.status === 'cancelado')

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Faturas</h1>
        <p className="mt-2 text-muted-foreground">Faturas em aberto e histórico de pagamentos — tudo num só lugar, sem trocar emails.</p>
      </header>

      <section aria-labelledby="faturas-abertas" className="grid gap-4">
        <h2 id="faturas-abertas" className="text-xl font-bold">
          Em aberto
        </h2>
        {open.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">Sem faturas por pagar neste momento.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {open.map((invoice) => (
              <li key={invoice.id}>
                <InvoiceListItem invoice={invoice} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="faturas-historico" className="grid gap-4">
        <h2 id="faturas-historico" className="text-xl font-bold">
          Histórico
        </h2>
        {history.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">Ainda sem faturas pagas ou canceladas.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {history.map((invoice) => (
              <li key={invoice.id}>
                <InvoiceListItem invoice={invoice} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
