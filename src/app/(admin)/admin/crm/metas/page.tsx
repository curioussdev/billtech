import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { upsertGoal } from '@/actions/goals'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { businessNow, listGoals } from '@/lib/admin/analytics'
import { isoWeekKey } from '@/lib/crm/analytics'
import { goalMetricLabels, goalPeriodLabels } from '@/lib/crm/labels'
import type { Goal, GoalMetric, GoalPeriodType } from '@/types/crm'

export const metadata: Metadata = { title: 'Metas' }

type Row = { periodType: GoalPeriodType; metric: GoalMetric; period: string; fallback: number; unit: 'eur' | 'pct' | 'int' | 'x' }

function buildRows(now: Date): Row[] {
  const dayKey = now.toISOString().slice(0, 10)
  const weekKey = isoWeekKey(now)
  const monthKey = now.toISOString().slice(0, 7)
  const yearKey = String(now.getUTCFullYear())
  return [
    { periodType: 'diaria', metric: 'cold_calls', period: dayKey, fallback: 50, unit: 'int' },
    { periodType: 'diaria', metric: 'meetings', period: dayKey, fallback: 2, unit: 'int' },
    { periodType: 'semanal', metric: 'cold_calls', period: weekKey, fallback: 250, unit: 'int' },
    { periodType: 'semanal', metric: 'meetings', period: weekKey, fallback: 10, unit: 'int' },
    { periodType: 'semanal', metric: 'proposals_value', period: weekKey, fallback: 5_000, unit: 'eur' },
    { periodType: 'mensal', metric: 'revenue', period: monthKey, fallback: 20_000, unit: 'eur' },
    { periodType: 'mensal', metric: 'win_rate', period: monthKey, fallback: 30, unit: 'pct' },
    { periodType: 'anual', metric: 'revenue', period: yearKey, fallback: 240_000, unit: 'eur' },
    { periodType: 'mensal', metric: 'ad_spend_max', period: monthKey, fallback: 1_000, unit: 'eur' },
    { periodType: 'mensal', metric: 'cpl_max', period: monthKey, fallback: 50, unit: 'eur' },
    { periodType: 'mensal', metric: 'roas_min', period: monthKey, fallback: 3, unit: 'x' },
  ]
}

const periodHint: Record<GoalPeriodType, (period: string) => string> = {
  diaria: (p) => `Dia ${new Date(p).toLocaleDateString('pt-PT', { timeZone: 'UTC' })}`,
  semanal: (p) => `Semana ${p}`,
  mensal: (p) => `Mês ${p}`,
  anual: (p) => `Ano ${p}`,
}

function findTarget(goals: Goal[], row: Row): number {
  return goals.find((g) => g.periodType === row.periodType && g.metric === row.metric && g.period === row.period)?.target ?? row.fallback
}

export default async function GoalsPage() {
  const goals = await listGoals()
  const rows = buildRows(businessNow())

  return (
    <div className="mx-auto max-w-2xl">
      <Button render={<Link href="/admin/crm" />} nativeButton={false} variant="ghost" size="sm" className="mb-4 -ml-2">
        <ArrowLeft className="size-4" aria-hidden /> Voltar ao Escritório Virtual
      </Button>

      <h1 className="text-3xl font-black tracking-tight">Metas</h1>
      <p className="mt-1 text-muted-foreground">Metas do período atual — diária, semanal, mensal e anual. Sem meta definida, os cartões do Escritório Virtual usam o valor por omissão indicado.</p>

      <div className="mt-6 grid gap-4">
        {rows.map((row) => {
          const current = findTarget(goals, row)
          const inputId = `${row.periodType}-${row.metric}`
          return (
            <Card key={inputId}>
              <CardContent className="flex flex-wrap items-end justify-between gap-4 p-5">
                <div>
                  <p className="font-semibold">
                    {goalPeriodLabels[row.periodType]} · {goalMetricLabels[row.metric]}
                  </p>
                  <p className="text-xs text-muted-foreground">{periodHint[row.periodType](row.period)}</p>
                </div>
                <form action={upsertGoal} className="flex items-end gap-2">
                  <input type="hidden" name="periodType" value={row.periodType} />
                  <input type="hidden" name="metric" value={row.metric} />
                  <input type="hidden" name="period" value={row.period} />
                  <div className="grid gap-1">
                    <Label htmlFor={inputId} className="sr-only">
                      Meta de {goalMetricLabels[row.metric]}
                    </Label>
                    <div className="flex items-center gap-1.5">
                      {row.unit === 'eur' && <span className="text-sm text-muted-foreground">€</span>}
                      <Input id={inputId} name="target" type="number" min={0} step={row.unit === 'eur' ? 1 : row.unit === 'pct' || row.unit === 'x' ? 0.1 : 1} defaultValue={current} className="w-28" required />
                      {row.unit === 'pct' && <span className="text-sm text-muted-foreground">%</span>}
                      {row.unit === 'x' && <span className="text-sm text-muted-foreground">×</span>}
                    </div>
                  </div>
                  <Button type="submit" size="sm">
                    Guardar
                  </Button>
                </form>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
