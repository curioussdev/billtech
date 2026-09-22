'use client'

import { Bar, BarChart, CartesianGrid, Cell, Funnel, FunnelChart, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { formatCompact, formatEUR, formatInt, formatPct } from '@/lib/admin/format'
import type { CrmDailyPoint, CrmFunnelStage, CrmLossSlice, CrmSectorRevenue } from '@/lib/crm/overview'

// Cores literais (não os tokens --chart-N da marca): pedido explícito de azul/emerald/rosa nesta página.
const BLUE = '#3b82f6'
const EMERALD = '#10b981'
const ROSE_SHADES = ['#fda4af', '#fb7185', '#f43f5e', '#e11d48', '#9f1239']

const prospectingConfig = {
  coldCalls: { label: 'Cold Calls Realizadas', color: BLUE },
  closings: { label: 'Fechamentos Ganho', color: EMERALD },
} satisfies ChartConfig

export function ProspectingLineChart({ data }: { data: CrmDailyPoint[] }) {
  return (
    <ChartContainer config={prospectingConfig} className="h-72 w-full" role="img" aria-label="Cold calls realizadas e fechamentos ganhos, últimos 30 dias">
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickFormatter={(d: string) => new Date(d).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', timeZone: 'UTC' })} tickLine={false} axisLine={false} minTickGap={28} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={28} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(d) => new Date(String(d)).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', timeZone: 'UTC' })} />} />
        <Line dataKey="coldCalls" stroke="var(--color-coldCalls)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Line dataKey="closings" stroke="var(--color-closings)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ChartContainer>
  )
}

export function SalesFunnelChart({ stages }: { stages: CrmFunnelStage[] }) {
  const colors = ['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8']
  const funnelConfig = Object.fromEntries(stages.map((s) => [s.label, { label: s.label }])) satisfies ChartConfig

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
      <ChartContainer config={funnelConfig} className="h-64 w-full" role="img" aria-label={`Funil de vendas: ${stages.map((s) => `${s.label} ${s.value}`).join(', ')}`}>
        <FunnelChart>
          <ChartTooltip content={<ChartTooltipContent hideIndicator nameKey="label" />} />
          <Funnel dataKey="value" data={stages} isAnimationActive={false}>
            {stages.map((stage, i) => (
              <Cell key={stage.label} fill={colors[i % colors.length]} />
            ))}
          </Funnel>
        </FunnelChart>
      </ChartContainer>
      <ul className="grid content-center gap-2 text-sm">
        {stages.map((stage, i) => (
          <li key={stage.label} className="flex items-baseline justify-between gap-4">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} aria-hidden />
              {stage.label}
            </span>
            <span className="text-right">
              <strong className="tabular-nums">{formatInt(stage.value)}</strong>
              {i > 0 && stages[i - 1].value > 0 && <span className="ml-1.5 text-xs text-muted-foreground">({formatPct((stage.value / stages[i - 1].value) * 100)})</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function LossReasonsDonut({ data }: { data: CrmLossSlice[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const lossConfig = Object.fromEntries(data.map((d) => [d.reason, { label: d.label }])) satisfies ChartConfig

  if (total === 0) return <p className="text-sm text-muted-foreground">Sem negócios perdidos registados — nada a analisar (ainda).</p>

  return (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
      <ChartContainer config={lossConfig} className="mx-auto aspect-square h-56 w-56" role="img" aria-label={`Motivos de perda: ${data.map((d) => `${d.label} ${formatPct((d.count / total) * 100)}`).join(', ')}`}>
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="reason" />} />
          <Pie data={data} dataKey="count" nameKey="reason" innerRadius={55} outerRadius={90} paddingAngle={2} strokeWidth={2}>
            {data.map((slice, i) => (
              <Cell key={slice.reason} fill={ROSE_SHADES[i % ROSE_SHADES.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="grid gap-2 text-sm">
        {data.map((slice, i) => (
          <li key={slice.reason} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: ROSE_SHADES[i % ROSE_SHADES.length] }} aria-hidden />
              {slice.label}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {slice.count} · {formatPct((slice.count / total) * 100)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const nicheConfig = { value: { label: 'Receita', color: EMERALD } } satisfies ChartConfig

export function RevenueByNicheChart({ data }: { data: CrmSectorRevenue[] }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground">Sem negócios ganhos registados por agora.</p>

  return (
    <ChartContainer config={nicheConfig} className="h-64 w-full" role="img" aria-label={`Receita por nicho: ${data.map((d) => `${d.label} ${formatEUR(d.value)}`).join(', ')}`}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v: number) => `${formatCompact(v)}€`} />
        <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={90} />
        <ChartTooltip cursor={{ fill: 'var(--muted)', opacity: 0.5 }} content={<ChartTooltipContent hideIndicator formatter={(value) => <span>{formatEUR(Number(value))}</span>} />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[0, 6, 6, 0]} maxBarSize={28} />
      </BarChart>
    </ChartContainer>
  )
}
