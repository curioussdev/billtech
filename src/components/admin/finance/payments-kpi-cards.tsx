import { AlertTriangle, Euro, Loader2, Repeat } from 'lucide-react'
import { KpiCard } from '@/components/admin/dashboard/kpi-card'
import { formatEUR, formatInt } from '@/lib/admin/format'

export interface PaymentsKpis {
  collectedThisMonth: number
  processingCount: number
  failedThisMonth: number
  autopayActiveCount: number
}

/** Resumo rápido de "Pagamentos & Débito Automático" — sem comparação a período anterior (ver nota de prioridade: funcionalidade primeiro). */
export function PaymentsKpiCards({ kpis }: { kpis: PaymentsKpis }) {
  return (
    <section aria-label="Indicadores de pagamentos" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard title="Cobrado este mês" icon={<Euro className="size-4" />} delay={0}>
        <p className="text-3xl font-black tabular-nums">{formatEUR(kpis.collectedThisMonth)}</p>
        <p className="text-xs text-muted-foreground">Pagamentos com sucesso, pagos este mês.</p>
      </KpiCard>
      <KpiCard title="A processar" icon={<Loader2 className="size-4" />} delay={0.05}>
        <p className="text-3xl font-black tabular-nums">{formatInt(kpis.processingCount)}</p>
        <p className="text-xs text-muted-foreground">Tentativas ainda sem confirmação (ex.: SEPA a caminho).</p>
      </KpiCard>
      <KpiCard title="Falhou este mês" icon={<AlertTriangle className="size-4" />} delay={0.1}>
        <p className="text-3xl font-black tabular-nums">{formatInt(kpis.failedThisMonth)}</p>
        <p className="text-xs text-muted-foreground">Tentativas de pagamento que não foram concluídas.</p>
      </KpiCard>
      <KpiCard title="Débito automático ativo" icon={<Repeat className="size-4" />} delay={0.15}>
        <p className="text-3xl font-black tabular-nums">{formatInt(kpis.autopayActiveCount)}</p>
        <p className="text-xs text-muted-foreground">Clientes com um método guardado para cobrar sozinho.</p>
      </KpiCard>
    </section>
  )
}
