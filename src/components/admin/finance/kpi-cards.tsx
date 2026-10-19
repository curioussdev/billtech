import { AlertTriangle, Euro, Heart, Repeat, Wallet } from 'lucide-react'
import { KpiCard } from '@/components/admin/dashboard/kpi-card'
import { formatEUR } from '@/lib/finance/labels'
import type { FinanceKpis } from '@/lib/finance/kpis'
import { cn } from '@/lib/utils'

export function FinanceKpiCards({ kpis, delay }: { kpis: FinanceKpis; delay?: number }) {
  const high = kpis.defaultRatePct >= 15
  return (
    <section aria-label="Indicadores financeiros" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard title="Receita Prevista (Mês)" icon={<Euro className="size-4" />} delay={delay}>
        <p className="text-3xl font-black tabular-nums">{formatEUR(kpis.expectedRevenueThisMonth)}</p>
        <p className="text-xs text-muted-foreground">Soma das faturas com vencimento este mês (exclui canceladas)</p>
      </KpiCard>

      <KpiCard title="Taxa de Inadimplência" icon={<AlertTriangle className="size-4" />} delay={(delay ?? 0) + 0.06}>
        <p className={cn('text-3xl font-black tabular-nums', high && 'text-destructive')}>{kpis.defaultRatePct.toLocaleString('pt-PT', { maximumFractionDigits: 1 })}%</p>
        <p className="text-xs text-muted-foreground">Valor atrasado sobre o total faturado em aberto</p>
      </KpiCard>

      <KpiCard title="LTV Médio (Fidelização)" icon={<Heart className="size-4" />} delay={(delay ?? 0) + 0.12}>
        <p className="text-3xl font-black tabular-nums">{formatEUR(kpis.averageLtv)}</p>
        <p className="text-xs text-muted-foreground">Total gasto médio, por cliente com histórico de pagamento</p>
      </KpiCard>

      <KpiCard title="Cobrado vs Faturado" icon={<Wallet className="size-4" />} delay={(delay ?? 0) + 0.18}>
        <p className="text-3xl font-black tabular-nums">{formatEUR(kpis.cashCollected)}</p>
        <p className="text-xs text-muted-foreground">
          {kpis.collectedPct.toLocaleString('pt-PT', { maximumFractionDigits: 1 })}% de {formatEUR(kpis.invoicedTotal)} faturados — dinheiro que entrou de verdade, não o que está prometido
        </p>
      </KpiCard>

      <KpiCard title="Clientes Repetentes" icon={<Repeat className="size-4" />} delay={(delay ?? 0) + 0.24}>
        <p className="text-3xl font-black tabular-nums">{kpis.repeatClientRatePct.toLocaleString('pt-PT', { maximumFractionDigits: 1 })}%</p>
        <p className="text-xs text-muted-foreground">Clientes com mais de uma fatura — a BillTech vende projetos, não subscrições, por isso esta é a métrica de retenção real</p>
      </KpiCard>
    </section>
  )
}
