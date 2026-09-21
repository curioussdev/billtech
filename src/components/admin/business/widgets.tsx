import { Reveal } from '@/components/motion/reveal'
import { Card, CardContent } from '@/components/ui/card'
import { projectStatusLabels } from '@/lib/admin/format'
import { cn } from '@/lib/utils'
import type { ProjectStatus } from '@/types/project'

/** Cartão de indicador simples com entrada animada. */
export function StatCard({ label, value, hint, delay = 0 }: { label: string; value: string; hint?: string; delay?: number }) {
  return (
    <Reveal delay={delay} className="h-full">
      <Card className="h-full">
        <CardContent className="grid gap-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-black tabular-nums sm:text-3xl">{value}</p>
          {hint && <p className="truncate text-xs text-muted-foreground" title={hint}>{hint}</p>}
        </CardContent>
      </Card>
    </Reveal>
  )
}

const statusStyles: Record<ProjectStatus, string> = {
  em_desenvolvimento: 'bg-amber-500/15 text-amber-900 dark:text-amber-300',
  em_teste: 'bg-violet-500/15 text-violet-800 dark:text-violet-300',
  entregue: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
}

export function BusinessStatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={cn('inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', statusStyles[status])}>{projectStatusLabels[status]}</span>
}
