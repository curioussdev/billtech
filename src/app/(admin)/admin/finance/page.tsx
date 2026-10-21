import type { Metadata } from 'next'
import Link from 'next/link'
import { FilterSelect } from '@/components/admin/filter-select'
import { DiscountCodesSection } from '@/components/admin/finance/discount-codes-section'
import { FinanceKpiCards } from '@/components/admin/finance/kpi-cards'
import { InvoiceTable } from '@/components/admin/finance/invoice-table'
import { LedgerSection } from '@/components/admin/finance/ledger-section'
import { LoyaltySection } from '@/components/admin/finance/loyalty-section'
import { PaymentsTable } from '@/components/admin/finance/payments-table'
import { Button } from '@/components/ui/button'
import { listAllInvoices, listAllPayments, listDiscountCodes, listExpenses, listFinanceSummary, listPortalClients } from '@/lib/finance/admin-queries'
import { computeFinanceKpis } from '@/lib/finance/kpis'
import { buildLedger } from '@/lib/finance/ledger'
import { INVOICE_STATUSES } from '@/types/finance'
import { invoiceStatusLabels } from '@/lib/finance/labels'

export const metadata: Metadata = { title: 'Financeiro' }

const selectClass = 'h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'

type Search = { status?: string; cliente?: string; periodo?: string }

export default async function AdminFinancePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const [invoices, payments, summaries, codes, clients, expenses] = await Promise.all([
    listAllInvoices(),
    listAllPayments(),
    listFinanceSummary(),
    listDiscountCodes(),
    listPortalClients(),
    listExpenses(),
  ])
  const kpis = computeFinanceKpis(invoices, summaries)
  const ledger = buildLedger(invoices, expenses)

  const now = new Date()
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

  const filtered = invoices.filter((i) => {
    if (sp.status && i.status !== sp.status) return false
    if (sp.cliente && i.clientId !== sp.cliente) return false
    if (sp.periodo === 'mes' && i.dueDate.slice(0, 7) !== monthKey) return false
    return true
  })
  const filteredPayments = payments.filter((p) => {
    if (sp.cliente && p.clientId !== sp.cliente) return false
    if (sp.periodo === 'mes' && (p.paidAt ?? '').slice(0, 7) !== monthKey) return false
    return true
  })

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Financeiro</h1>
        <p className="mt-1 text-muted-foreground">Faturas, parcelamentos, descontos e fidelização — controlo de 360º.</p>
      </div>

      <FinanceKpiCards kpis={kpis} />

      <form method="get" aria-label="Filtros" className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[repeat(3,1fr)_auto]">
        <label className="grid gap-1 text-xs font-medium">
          Status
          <select name="status" defaultValue={sp.status ?? ''} className={selectClass}>
            <option value="">Todos</option>
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {invoiceStatusLabels[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium">
          Cliente
          <FilterSelect name="cliente" items={clients.map((c) => ({ value: c.id, label: c.name }))} defaultValue={sp.cliente ?? ''} placeholder="Todos" ariaLabel="Filtrar por cliente" />
        </label>
        <label className="grid gap-1 text-xs font-medium">
          Período
          <select name="periodo" defaultValue={sp.periodo ?? ''} className={selectClass}>
            <option value="">Todo o histórico</option>
            <option value="mes">Vencimento este mês</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit" size="sm">
            Filtrar
          </Button>
          <Button render={<Link href="/admin/finance" />} nativeButton={false} variant="ghost" size="sm">
            Limpar
          </Button>
        </div>
      </form>

      <p className="text-sm text-muted-foreground" role="status">
        {filtered.length} {filtered.length === 1 ? 'fatura' : 'faturas'}
      </p>
      <InvoiceTable invoices={filtered} />

      <section aria-labelledby="pagamentos-registados" className="grid gap-4">
        <div>
          <h2 id="pagamentos-registados" className="text-xl font-bold">
            Pagamentos registados
          </h2>
          <p className="text-sm text-muted-foreground">Sem Stripe ativo, tudo o que entra é cobrado fora da plataforma — aqui fica o registo de quando, de quem, quanto e por quem.</p>
        </div>
        <PaymentsTable payments={filteredPayments} />
      </section>

      <section aria-labelledby="ledger" className="grid gap-4">
        <div>
          <h2 id="ledger" className="text-xl font-bold">
            Ledger — Faturado, Recebido e Despesas
          </h2>
          <p className="text-sm text-muted-foreground">Todos os movimentos financeiros numa só linha do tempo.</p>
        </div>
        <LedgerSection entries={ledger} />
      </section>

      <section aria-labelledby="fidelizacao" className="grid gap-4">
        <div>
          <h2 id="fidelizacao" className="text-xl font-bold">
            Fidelização &amp; Retenção
          </h2>
          <p className="text-sm text-muted-foreground">Clientes ordenados por total gasto — use os pontos de bónus como ferramenta de retenção.</p>
        </div>
        <LoyaltySection summaries={summaries} />
      </section>

      <section aria-labelledby="descontos" className="grid gap-4">
        <div>
          <h2 id="descontos" className="text-xl font-bold">
            Códigos de desconto
          </h2>
          <p className="text-sm text-muted-foreground">Reutilizáveis em qualquer fatura, pelo código.</p>
        </div>
        <DiscountCodesSection codes={codes} />
      </section>
    </div>
  )
}
