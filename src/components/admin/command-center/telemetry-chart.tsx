'use client'

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { TelemetryDayPoint } from '@/lib/command-center/queries'

const config = {
  pageViews: { label: 'Visitas', color: 'var(--chart-1)' },
  errors: { label: 'Erros', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function TelemetryChart({ data }: { data: TelemetryDayPoint[] }) {
  return (
    <ChartContainer config={config} className="h-72 w-full" role="img" aria-label="Visitas e erros registados por dia, últimos 30 dias">
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickFormatter={(d: string) => new Date(d).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', timeZone: 'UTC' })} tickLine={false} axisLine={false} minTickGap={28} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={28} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(d) => new Date(String(d)).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', timeZone: 'UTC' })} />} />
        <Line dataKey="pageViews" stroke="var(--color-pageViews)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Line dataKey="errors" stroke="var(--color-errors)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ChartContainer>
  )
}
