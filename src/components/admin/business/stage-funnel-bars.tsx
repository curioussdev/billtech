import { formatEUR, formatInt, formatPct, leadStageLabels } from '@/lib/admin/format'
import type { LeadStage } from '@/types/lead'

/** Sequência real do funil (captado → ganho); `perdido` é um desfecho divergente de `negociacao`, não o passo seguinte a `ganho` — por isso fica à parte, não como mais uma barra na sequência. */
const FUNNEL_SEQUENCE: LeadStage[] = ['captado', 'qualificado', 'proposta', 'negociacao', 'ganho']

/**
 * Barras horizontais por etapa (valor € + % de conversão face à etapa anterior) — o equivalente do
 * "Pipeline Comercial" do CRM de referência, calculado a partir de `funnelMetrics().byStage` já
 * existente (sem nova entidade de etapas, ver supabase/029_marketing.sql).
 */
export function StageFunnelBars({ byStage, perdido }: { byStage: Record<LeadStage, { count: number; value: number }>; perdido: { count: number; value: number } }) {
  const maxCount = Math.max(1, ...FUNNEL_SEQUENCE.map((s) => byStage[s].count))

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-4">
      <h3 className="text-sm font-bold text-muted-foreground">Pipeline Comercial — por etapa</h3>
      <ul className="grid gap-2.5">
        {FUNNEL_SEQUENCE.map((stage, i) => {
          const { count, value } = byStage[stage]
          const widthPct = (count / maxCount) * 100
          const prevCount = i > 0 ? byStage[FUNNEL_SEQUENCE[i - 1]].count : null
          const conversionPct = prevCount && prevCount > 0 ? (count / prevCount) * 100 : null
          return (
            <li key={stage} className="grid grid-cols-[8rem_1fr_auto] items-center gap-3 text-sm">
              <span className="truncate font-medium">{leadStageLabels[stage]}</span>
              <div className="h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${leadStageLabels[stage]}: ${count} negócios`} aria-valuemin={0} aria-valuemax={maxCount} aria-valuenow={count}>
                <div className={i === FUNNEL_SEQUENCE.length - 1 ? 'h-full rounded-full bg-emerald-500 transition-[width] duration-700' : 'h-full rounded-full bg-primary transition-[width] duration-700'} style={{ width: `${widthPct}%` }} />
              </div>
              <span className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
                {formatInt(count)} · {formatEUR(value)}
                {conversionPct !== null && <span className="ml-1.5 text-xs">({formatPct(conversionPct)})</span>}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        Perdidos: <strong className="font-semibold text-foreground">{formatInt(perdido.count)}</strong> negócios · {formatEUR(perdido.value)} em valor estimado.
      </p>
    </div>
  )
}
