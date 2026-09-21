'use client'

import { Area, AreaChart, XAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { TimeSeriesPoint } from '@/types/analytics'

const config = { value: { label: 'Visitas', color: 'var(--chart-1)' } } satisfies ChartConfig

export function Sparkline({ data, label }: { data: TimeSeriesPoint[]; label: string }) {
  return (
    <ChartContainer config={config} className="h-16 w-full" role="img" aria-label={label}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideIndicator labelFormatter={(value) => new Date(String(value)).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })} />}
        />
        <Area dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={2} fill="url(#spark-fill)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ChartContainer>
  )
}
