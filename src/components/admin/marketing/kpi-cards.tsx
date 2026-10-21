import { AlertTriangle, CheckCircle2, Euro, Eye, MousePointerClick, Percent, Target, TrendingUp, Users } from 'lucide-react'
import { ChangeBadge, KpiCard } from '@/components/admin/dashboard/kpi-card'
import { Sparkline } from '@/components/admin/dashboard/sparkline'
import { formatEUR, formatInt, formatPct } from '@/lib/admin/format'
import type { Metric } from '@/lib/admin/reports'
import type { MarketingOverview } from '@/lib/marketing/overview'

/**
 * Indicador "dentro/fora da meta" — teto (`direction="maximo"`, ex. CPL máximo: ultrapassar é "fora")
 * ou piso (`direction="minimo"`, ex. ROAS mínimo: ficar abaixo é "fora"). Mesma paleta verde/vermelho
 * do `GoalPaceCard`, só que a comparação é invertida para os tetos.
 */
function LimitBadge({ value, target, direction, format }: { value: number; target: number; direction: 'minimo' | 'maximo'; format: (n: number) => string }) {
  const within = direction === 'maximo' ? value <= target : value >= target
  return (
    <span className={within ? 'inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400' : 'inline-flex items-center gap-1 text-xs font-medium text-rose-700 dark:text-rose-400'}>
      {within ? <CheckCircle2 className="size-3.5" aria-hidden /> : <AlertTriangle className="size-3.5" aria-hidden />}
      {direction === 'maximo' ? 'máx.' : 'mín.'} {format(target)}
      {!within && ' · fora'}
    </span>
  )
}

/** Cartão genérico: valor + variação face ao período anterior + uma linha de contexto. Sem meta própria (ver GoalPaceCard para isso). */
function MetricCard({ title, icon, data, format = formatInt, hint, delay }: { title: string; icon: React.ReactNode; data: Metric; format?: (n: number) => string; hint?: string; delay?: number }) {
  return (
    <KpiCard title={title} icon={icon} delay={delay}>
      <div className="flex items-end justify-between gap-2">
        <p className="text-3xl font-black tabular-nums">{format(data.value)}</p>
        {data.changePct !== null && <ChangeBadge value={data.changePct} />}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </KpiCard>
  )
}

/** Linha 1: investimento e alcance — os únicos dois com série diária calculada, por isso os únicos com sparkline por agora (ver nota de prioridade: funcionalidade primeiro, polimento visual fica para o fim). */
export function SpendCard({ data, series, windowDays, goalMax, delay }: { data: MarketingOverview['spend']; series: MarketingOverview['dailySpend']; windowDays: number; goalMax?: number; delay?: number }) {
  return (
    <KpiCard title={`Investimento (${windowDays} dias)`} icon={<Euro className="size-4" />} delay={delay}>
      <div className="flex items-end justify-between gap-2">
        <p className="text-3xl font-black tabular-nums">{formatEUR(data.value)}</p>
        {data.changePct !== null && <ChangeBadge value={data.changePct} />}
      </div>
      <Sparkline data={series} label={`Investimento diário em anúncios, total ${formatEUR(data.value)}`} />
      {goalMax !== undefined && <LimitBadge value={data.value} target={goalMax} direction="maximo" format={formatEUR} />}
    </KpiCard>
  )
}

export function ImpressionsCard({ data, delay }: { data: MarketingOverview['impressions']; delay?: number }) {
  return <MetricCard title="Impressões" icon={<Eye className="size-4" />} data={data} delay={delay} />
}

export function ClicksCard({ data, delay }: { data: MarketingOverview['clicks']; delay?: number }) {
  return <MetricCard title="Cliques no link" icon={<MousePointerClick className="size-4" />} data={data} delay={delay} />
}

export function CtrCard({ data, delay }: { data: MarketingOverview['ctrPct']; delay?: number }) {
  return <MetricCard title="CTR" icon={<Percent className="size-4" />} data={data} format={formatPct} delay={delay} />
}

export function CpcCard({ data, delay }: { data: MarketingOverview['cpc']; delay?: number }) {
  return <MetricCard title="CPC — custo por clique" icon={<Euro className="size-4" />} data={data} format={formatEUR} delay={delay} />
}

export function CpmCard({ data, delay }: { data: MarketingOverview['cpm']; delay?: number }) {
  return <MetricCard title="CPM — custo por mil impressões" icon={<Euro className="size-4" />} data={data} format={formatEUR} delay={delay} />
}

export function PlatformLeadsCard({ data, delay }: { data: MarketingOverview['platformLeads']; delay?: number }) {
  return <MetricCard title="Leads (plataforma)" icon={<Users className="size-4" />} data={data} hint="Reportados pela própria plataforma de anúncios." delay={delay} />
}

export function CplCard({ data, delay }: { data: MarketingOverview['cpl']; delay?: number }) {
  return <MetricCard title="CPL (plataforma)" icon={<Euro className="size-4" />} data={data} format={formatEUR} delay={delay} />
}

export function CrmContactsCard({ data, delay }: { data: MarketingOverview['crmContacts']; delay?: number }) {
  return <MetricCard title="Contactos (CRM)" icon={<Users className="size-4" />} data={data} hint="Leads que realmente entraram no Pipeline com esta origem." delay={delay} />
}

export function CplRealCard({ data, series, goalMax, delay }: { data: MarketingOverview['cplReal']; series: MarketingOverview['dailyCplReal']; goalMax?: number; delay?: number }) {
  return (
    <KpiCard title="CPL real (CRM)" icon={<Euro className="size-4" />} delay={delay}>
      <div className="flex items-end justify-between gap-2">
        <p className="text-3xl font-black tabular-nums">{formatEUR(data.value)}</p>
        {data.changePct !== null && <ChangeBadge value={data.changePct} />}
      </div>
      <Sparkline data={series} label={`Custo por lead real, dia a dia`} />
      <p className="text-xs text-muted-foreground">Gasto ÷ contactos reais no CRM — tende a ser maior que o CPL da plataforma.</p>
      {goalMax !== undefined && <LimitBadge value={data.value} target={goalMax} direction="maximo" format={formatEUR} />}
    </KpiCard>
  )
}

export function AdSalesCard({ data, delay }: { data: MarketingOverview['adSales']; delay?: number }) {
  return <MetricCard title="Vendas dos anúncios" icon={<Target className="size-4" />} data={data} hint="Negócios ganhos atribuídos a uma campanha." delay={delay} />
}

export function RoasCard({ roas, spend, goalMin, delay }: { roas: number | null; spend: number; goalMin?: number; delay?: number }) {
  return (
    <KpiCard title="ROAS dos anúncios" icon={<TrendingUp className="size-4" />} delay={delay}>
      <p className="text-3xl font-black tabular-nums">{roas === null ? '—' : `${formatInt(Math.round(roas * 10) / 10)}×`}</p>
      <p className="text-xs text-muted-foreground">{roas === null ? 'Sem vendas atribuídas a uma campanha ainda.' : `Receita atribuída ÷ ${formatEUR(spend)} investidos.`}</p>
      {goalMin !== undefined && roas !== null && <LimitBadge value={roas} target={goalMin} direction="minimo" format={(n) => `${formatInt(Math.round(n * 10) / 10)}×`} />}
    </KpiCard>
  )
}
