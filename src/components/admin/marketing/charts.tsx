'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { formatEUR } from '@/lib/admin/format'
import type { TimeSeriesPoint } from '@/types/analytics'

const config = { value: { label: 'Investimento', color: 'var(--chart-1)' } } satisfies ChartConfig

export function DailySpendChart({ data }: { data: TimeSeriesPoint[] }) {
  return (
    <ChartContainer config={config} className="h-64 w-full" role="img" aria-label="Investimento diário em anúncios, últimos 30 dias">
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickFormatter={(d: string) => new Date(d).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', timeZone: 'UTC' })} tickLine={false} axisLine={false} minTickGap={28} />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => formatEUR(v)} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(d) => new Date(String(d)).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', timeZone: 'UTC' })} formatter={(value) => <span>{formatEUR(Number(value))}</span>} />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ChartContainer>
  )
}
