import { TrendingDown, TrendingUp } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPct } from '@/lib/admin/format'
import { cn } from '@/lib/utils'

/** Variação com seta + sinal + texto: nunca depende só da cor (daltonismo). */
export function ChangeBadge({ value, className }: { value: number; className?: string }) {
  const positive = value >= 0
  const Icon = positive ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        positive ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/15 text-red-700 dark:text-red-400',
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {formatPct(value, true)}
      <span className="sr-only">{positive ? 'de aumento' : 'de queda'} face ao período anterior</span>
    </span>
  )
}

type KpiCardProps = {
  title: string
  icon: React.ReactNode
  /** Atraso da animação de entrada (s) — escalona os cartões */
  delay?: number
  children: React.ReactNode
  className?: string
}

/** Casca comum dos 4 KPIs, com fade-in + slide-up ao entrar na viewport. */
export function KpiCard({ title, icon, delay = 0, children, className }: KpiCardProps) {
  return (
    <Reveal delay={delay} className="h-full">
      <Card className={cn('h-full', className)}>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <span className="text-muted-foreground" aria-hidden>
            {icon}
          </span>
        </CardHeader>
        <CardContent className="grid gap-3">{children}</CardContent>
      </Card>
    </Reveal>
  )
}
