import { AlertTriangle, CalendarClock, TrendingUp } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { Card, CardContent } from '@/components/ui/card'
import { formatEUR, formatPct } from '@/lib/admin/format'
import { cn } from '@/lib/utils'
import type { CrmOverview } from '@/lib/crm/overview'

/** Posição do dia de hoje no ano (1-indexado), dias restantes e % do ano já decorrido — para o marcador de "ritmo ideal" na barra. */
function yearProgress(asOf: string) {
  const date = new Date(asOf)
  const year = date.getUTCFullYear()
  const startOfYear = Date.UTC(year, 0, 1)
  const startOfNextYear = Date.UTC(year + 1, 0, 1)
  const totalDays = Math.round((startOfNextYear - startOfYear) / 86_400_000)
  const dayOfYear = Math.floor((date.getTime() - startOfYear) / 86_400_000) + 1
  return { year, totalDays, dayOfYear, daysRemaining: totalDays - dayOfYear, elapsedPct: (dayOfYear / totalDays) * 100 }
}

export function YearlyGoalCard({ data, asOf, delay }: { data: CrmOverview['yearlyGoal']; asOf: string; delay?: number }) {
  const progress = Math.min(100, Math.round(data.progressPct))
  const missing = Math.max(0, data.target - data.current)
  const { year, dayOfYear, totalDays, daysRemaining, elapsedPct } = yearProgress(asOf)

  return (
    <Reveal delay={delay}>
      <Card className="border-2 border-primary/20">
        <CardContent className="grid gap-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">Caminho para a Receita Gigante — Meta Anual {year}: {formatEUR(data.target)}</h2>
            {data.onPace ? (
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                <TrendingUp className="size-4" aria-hidden /> No Pace
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-rose-500/15 px-3 py-1 text-sm font-semibold text-rose-800 dark:text-rose-300">
                <AlertTriangle className="size-4" aria-hidden /> Abaixo do Pace
              </span>
            )}
          </div>

          <div className="relative">
            <div
              role="progressbar"
              aria-label="Progresso da receita face à meta anual"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="h-6 overflow-hidden rounded-full bg-muted"
            >
              <div className={cn('h-full rounded-full transition-[width] duration-700', data.onPace ? 'bg-emerald-500' : 'bg-rose-500')} style={{ width: `${progress}%` }} />
            </div>
            <div
              className="absolute top-0 h-6 w-0.5 bg-foreground/60"
              style={{ left: `${Math.min(100, elapsedPct)}%` }}
              title={`Ritmo ideal hoje: ${Math.round(elapsedPct)}% do ano decorrido`}
            />
          </div>

          <p className="text-base leading-7">
            <strong className="tabular-nums">{formatEUR(data.current)}</strong> alcançados ({formatPct(data.progressPct)}) — faltam{' '}
            <strong className="tabular-nums">{formatEUR(missing)}</strong>
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <CalendarClock className="size-4 shrink-0" aria-hidden />
            Dia <strong className="text-foreground tabular-nums">{dayOfYear}</strong> de {totalDays} —{' '}
            <strong className={cn('tabular-nums', daysRemaining <= 30 && 'text-rose-700 dark:text-rose-400')}>{daysRemaining} dias restantes</strong> para fechar o ano
          </p>
          <p className="text-sm text-muted-foreground">
            No ritmo atual, fecha o ano com <strong className="text-foreground">{formatEUR(data.projected)}</strong>.
          </p>
        </CardContent>
      </Card>
    </Reveal>
  )
}
