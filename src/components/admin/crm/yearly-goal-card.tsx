import { AlertTriangle, TrendingUp } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { Card, CardContent } from '@/components/ui/card'
import { formatEUR, formatPct } from '@/lib/admin/format'
import { cn } from '@/lib/utils'
import type { CrmOverview } from '@/lib/crm/overview'

export function YearlyGoalCard({ data, delay }: { data: CrmOverview['yearlyGoal']; delay?: number }) {
  const progress = Math.min(100, Math.round(data.progressPct))
  const missing = Math.max(0, data.target - data.current)

  return (
    <Reveal delay={delay}>
      <Card>
        <CardContent className="grid gap-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">Caminho para a Receita Gigante — Meta Anual: {formatEUR(data.target)}</h2>
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

          <p className="text-base leading-7">
            <strong className="tabular-nums">{formatEUR(data.current)}</strong> alcançados ({formatPct(data.progressPct)}) — faltam{' '}
            <strong className="tabular-nums">{formatEUR(missing)}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            No ritmo atual, fecha o ano com <strong className="text-foreground">{formatEUR(data.projected)}</strong>.
          </p>
        </CardContent>
      </Card>
    </Reveal>
  )
}
