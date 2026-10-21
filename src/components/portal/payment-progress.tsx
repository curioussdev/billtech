import { formatEUR } from '@/lib/finance/labels'
import type { PaymentProgress } from '@/lib/finance/progress'

/** "Quanto já foi pago" — mesmo visual no lado do cliente e no admin, para nunca mostrarem números diferentes. */
export function PaymentProgressBar({ progress, compact }: { progress: PaymentProgress; compact?: boolean }) {
  const pct = Math.min(100, Math.round(progress.pct))
  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <p className={compact ? 'text-sm font-semibold' : 'text-base font-semibold'}>
          {formatEUR(progress.paidAmount)} <span className="font-normal text-muted-foreground">de {formatEUR(progress.totalAmount)} pago</span>
        </p>
        {progress.totalCount > 1 && (
          <p className="text-xs text-muted-foreground">
            {progress.paidCount}/{progress.totalCount} parcelas
          </p>
        )}
      </div>
      <div role="progressbar" aria-label="Progresso do pagamento" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
      {progress.remainingAmount > 0 && <p className="text-xs text-muted-foreground">Faltam {formatEUR(progress.remainingAmount)}</p>}
    </div>
  )
}
