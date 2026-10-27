import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FilterSelect } from '@/components/admin/filter-select'
import { AutopaySection } from '@/components/admin/finance/autopay-section'
import { PaymentsKpiCards, type PaymentsKpis } from '@/components/admin/finance/payments-kpi-cards'
import { PaymentsTable } from '@/components/admin/finance/payments-table'
import { RegisterMandateDialog } from '@/components/admin/finance/register-mandate-dialog'
import { Button } from '@/components/ui/button'
import { listAllPaymentAttempts, listPortalClients } from '@/lib/finance/admin-queries'
import { listAutopayOverview } from '@/lib/finance/autopay-queries'
import { paymentStatusLabels } from '@/lib/finance/labels'
import { PAYMENT_STATUSES } from '@/types/finance'

export const metadata: Metadata = { title: 'Pagamentos & Débito Automático' }

const selectClass = 'h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'

type Search = { status?: string; cliente?: string; periodo?: string }

function computeKpis(payments: Awaited<ReturnType<typeof listAllPaymentAttempts>>, autopayCount: number): PaymentsKpis {
  const now = new Date()
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const inThisMonth = (iso: string | null) => Boolean(iso && iso.slice(0, 7) === monthKey)

  return {
    collectedThisMonth: payments.filter((p) => p.status === 'sucesso' && inThisMonth(p.paidAt)).reduce((sum, p) => sum + p.amount, 0),
    processingCount: payments.filter((p) => p.status === 'pendente').length,
    failedThisMonth: payments.filter((p) => p.status === 'falhou' && inThisMonth(p.createdAt)).length,
    autopayActiveCount: autopayCount,
  }
}

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const [payments, clients, autopayRows] = await Promise.all([listAllPaymentAttempts(), listPortalClients(), listAutopayOverview()])

  const now = new Date()
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const filtered = payments.filter((p) => {
    if (sp.status && p.status !== sp.status) return false
    if (sp.cliente && p.clientId !== sp.cliente) return false
    if (sp.periodo === 'mes' && p.createdAt.slice(0, 7) !== monthKey) return false
    return true
  })

  const kpis = computeKpis(payments, autopayRows.length)

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <Button render={<Link href="/admin/finance" />} nativeButton={false} variant="ghost" size="sm" className="w-fit -ml-2">
        <ArrowLeft className="size-4" aria-hidden /> Voltar a Financeiro
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Pagamentos &amp; Débito Automático</h1>
          <p className="mt-1 text-muted-foreground">Todas as tentativas de pagamento (com sucesso, a processar ou falhadas) e quem tem cobrança automática ativa — por cartão ou IBAN.</p>
        </div>
        <RegisterMandateDialog clients={clients} />
      </div>

      <PaymentsKpiCards kpis={kpis} />

      <form method="get" aria-label="Filtros" className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[repeat(3,1fr)_auto]">
        <label className="grid gap-1 text-xs font-medium">
          Estado
          <select name="status" defaultValue={sp.status ?? ''} className={selectClass}>
            <option value="">Todos</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {paymentStatusLabels[s]}
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
            <option value="mes">Este mês</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit" size="sm">
            Filtrar
          </Button>
          <Button render={<Link href="/admin/finance/pagamentos" />} nativeButton={false} variant="ghost" size="sm">
            Limpar
          </Button>
        </div>
      </form>

      <section aria-labelledby="pagamentos-registados" className="grid gap-4">
        <div>
          <p role="status" className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'tentativa de pagamento' : 'tentativas de pagamento'}
          </p>
        </div>
        <PaymentsTable payments={filtered} />
      </section>

      <section aria-labelledby="debito-automatico" className="grid gap-4">
        <div>
          <h2 id="debito-automatico" className="text-xl font-bold">
            Débito automático
          </h2>
          <p className="text-sm text-muted-foreground">Clientes que ativaram cobrança automática (cartão ou IBAN) — cobre a próxima fatura/parcela com um clique, sem esperar pelo cron.</p>
        </div>
        <AutopaySection rows={autopayRows} />
      </section>
    </div>
  )
}
