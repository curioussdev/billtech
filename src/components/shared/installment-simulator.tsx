'use client'

import { buildInstallmentRows } from '@/lib/finance/installments'
import { formatDate, formatEUR } from '@/lib/finance/labels'

/**
 * Simulador de prestações — controlado pelo chamador (`months`/`onMonthsChange`), puramente
 * apresentação: recalcula ao vivo pela mesma fórmula de `buildInstallmentRows` (a única fonte de
 * verdade do arredondamento, partilhada com as Server Actions que gravam o plano a sério). Não tem
 * botão de confirmar — cada sítio que o usa (cliente ou admin) mantém o seu próprio fluxo de
 * submissão, isto só ajuda a escolher o nº de meses.
 */
export function InstallmentSimulator({
  totalAmount,
  dueDateBase,
  months,
  onMonthsChange,
  min = 2,
  max = 12,
  idPrefix = 'sim',
}: {
  totalAmount: number
  dueDateBase: string
  months: number
  onMonthsChange: (months: number) => void
  min?: number
  max?: number
  idPrefix?: string
}) {
  const rows = totalAmount > 0 && months >= min ? buildInstallmentRows(totalAmount, months, dueDateBase) : []
  // A 1ª prestação leva o cêntimo de arredondamento — a 2ª (quando existe) representa o valor "normal" a mostrar em destaque.
  const headlineAmount = rows[1]?.amount ?? rows[0]?.amount ?? 0

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`${idPrefix}-months`} className="text-sm font-medium">
          Número de prestações
        </label>
        <span className="text-sm font-semibold tabular-nums">{months}x</span>
      </div>
      <input
        id={`${idPrefix}-months`}
        type="range"
        min={min}
        max={max}
        step={1}
        value={months}
        onChange={(e) => onMonthsChange(Number(e.target.value))}
        className="w-full accent-[var(--primary)]"
        aria-label="Número de prestações"
        aria-valuetext={`${months} prestações`}
      />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-xs text-muted-foreground">Valor por prestação (aprox.)</span>
        <span className="text-2xl font-black tabular-nums">{formatEUR(headlineAmount)}</span>
      </div>
      {rows.length > 0 && (
        <ul className="grid max-h-36 gap-1 overflow-y-auto text-xs text-muted-foreground" aria-label="Datas e valores de cada prestação">
          {rows.map((r) => (
            <li key={r.installment_number} className="flex items-center justify-between gap-3">
              <span>
                Prestação {r.installment_number}/{months}
              </span>
              <span className="tabular-nums">
                {formatDate(r.due_date)} · {formatEUR(r.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
