'use client'

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { formatCompact, formatEUR, formatMonth, sectorLabels } from '@/lib/admin/format'
import type { MonthlyRevenuePoint, SectorDeliveryPoint } from '@/types/analytics'

const revenueConfig = {
  revenue: { label: 'Receita', color: 'var(--chart-1)' },
  projected: { label: 'Projeção de fecho', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function RevenueLineChart({ data }: { data: MonthlyRevenuePoint[] }) {
  // A projeção liga o último mês real ao valor projetado (linha tracejada)
  const last = data.length - 1
  const points = data.map((p, i) => ({
    label: formatMonth(p.month),
    revenue: p.revenue,
    projected: i === last && p.projected !== undefined ? p.projected : i === last - 1 ? p.revenue : undefined,
  }))

  return (
    <ChartContainer config={revenueConfig} className="h-72 w-full" role="img" aria-label="Receita mensal dos últimos 6 meses, com projeção de fecho do mês corrente">
      <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => `${formatCompact(v)}€`} />
        <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => <span>{`${revenueConfig[name as keyof typeof revenueConfig]?.label ?? name}: ${formatEUR(Number(value))}`}</span>} />} />
        <Line dataKey="projected" type="monotone" stroke="var(--color-projected)" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
        <Line dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ChartContainer>
  )
}

const sectorConfig = { delivered: { label: 'Projetos entregues', color: 'var(--chart-1)' } } satisfies ChartConfig

export function SectorBarChart({ data }: { data: SectorDeliveryPoint[] }) {
  const points = data.map((d) => ({ sector: sectorLabels[d.sector], delivered: d.delivered }))

  return (
    <ChartContainer config={sectorConfig} className="h-72 w-full" role="img" aria-label="Projetos entregues por setor">
      <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="sector" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={28} />
        <ChartTooltip cursor={{ fill: 'var(--muted)', opacity: 0.5 }} content={<ChartTooltipContent hideIndicator />} />
        <Bar dataKey="delivered" fill="var(--color-delivered)" radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ChartContainer>
  )
}
