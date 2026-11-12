import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { InvoiceListItem } from '@/components/portal/invoice-widgets'
import { Surface } from '@/components/portal/surface'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/auth'
import { getMyInvoices } from '@/lib/finance/queries'

export const metadata: Metadata = { title: 'Pagamentos e Faturas' }

export default async function PortalInvoicesPage() {
  const profile = await requireUser()
  const invoices = await getMyInvoices(profile.id)
  const open = invoices.filter((i) => i.status === 'pendente' || i.status === 'atrasado')
  const history = invoices.filter((i) => i.status === 'pago' || i.status === 'cancelado')

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Pagamentos e Faturas</h1>
          <p className="mt-2 text-muted-foreground">Faturas em aberto, parcelas e pagamentos já feitos — incluindo os feitos fora da plataforma — tudo num só lugar, sem trocar emails.</p>
        </div>
        <Button render={<Link href="/area-cliente/pagamentos/metodo" />} nativeButton={false} variant="outline" size="sm">
          <ShieldCheck className="size-4" aria-hidden /> Débito automático
        </Button>
      </header>

      <section aria-labelledby="faturas-abertas" className="grid gap-4">
        <h2 id="faturas-abertas" className="text-xl font-bold">
          Em aberto
        </h2>
        {open.length === 0 ? (
          <Surface tone="dashed" className="p-8 text-center text-muted-foreground">Sem faturas por pagar neste momento.</Surface>
        ) : (
          <Surface as="ul" className="divide-y divide-border overflow-hidden">
            {open.map((invoice, i) => (
              <li key={invoice.id}>
                <Reveal delay={Math.min(i, 5) * 0.05} y={12}>
                  <InvoiceListItem invoice={invoice} />
                </Reveal>
              </li>
            ))}
          </Surface>
        )}
      </section>

      <section aria-labelledby="faturas-historico" className="grid gap-4">
        <h2 id="faturas-historico" className="text-xl font-bold">
          Histórico
        </h2>
        {history.length === 0 ? (
          <Surface tone="dashed" className="p-6 text-sm text-muted-foreground">Ainda sem faturas pagas ou canceladas.</Surface>
        ) : (
          <Surface as="ul" className="divide-y divide-border overflow-hidden">
            {history.map((invoice) => (
              <li key={invoice.id}>
                <InvoiceListItem invoice={invoice} />
              </li>
            ))}
          </Surface>
        )}
      </section>
    </div>
  )
}
