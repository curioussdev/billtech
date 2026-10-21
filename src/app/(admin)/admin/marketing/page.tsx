import type { Metadata } from 'next'
import Link from 'next/link'
import { Target } from 'lucide-react'
import { CampaignsSection } from '@/components/admin/marketing/campaigns-section'
import { DailySpendChart } from '@/components/admin/marketing/charts'
import {
  AdSalesCard,
  ClicksCard,
  CpcCard,
  CplCard,
  CplRealCard,
  CpmCard,
  CrmContactsCard,
  CtrCard,
  ImpressionsCard,
  PlatformLeadsCard,
  RoasCard,
  SpendCard,
} from '@/components/admin/marketing/kpi-cards'
import { MetricsEntryForm } from '@/components/admin/marketing/metrics-form'
import { ChartCard } from '@/components/admin/dashboard/chart-card'
import { Button } from '@/components/ui/button'
import { businessNow, listCampaigns, listGoals } from '@/lib/admin/analytics'
import { getMarketingOverview } from '@/lib/marketing/overview'

export const metadata: Metadata = { title: 'Marketing' }

export default async function MarketingPage() {
  const [overview, campaigns, goals] = await Promise.all([getMarketingOverview(), listCampaigns(), listGoals()])
  const monthKey = businessNow().toISOString().slice(0, 7)
  const goalTarget = (metric: 'ad_spend_max' | 'cpl_max' | 'roas_min') => goals.find((g) => g.periodType === 'mensal' && g.metric === metric && g.period === monthKey)?.target

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Marketing</h1>
          <p className="mt-1 text-muted-foreground">
            Campanhas pagas, investimento e o que realmente chegou ao CRM — últimos {overview.windowDays} dias vs. os {overview.windowDays} anteriores. Sem integração ao vivo com as plataformas: os números são registados manualmente, como o resto do Financeiro.
          </p>
        </div>
        <Button render={<Link href="/admin/crm/metas" />} nativeButton={false} variant="outline" size="sm">
          <Target className="size-4" aria-hidden /> Definir tetos/pisos
        </Button>
      </div>

      <section aria-label="Investimento e alcance" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SpendCard data={overview.spend} series={overview.dailySpend} windowDays={overview.windowDays} goalMax={goalTarget('ad_spend_max')} delay={0} />
        <ImpressionsCard data={overview.impressions} delay={0.05} />
        <ClicksCard data={overview.clicks} delay={0.1} />
        <CtrCard data={overview.ctrPct} delay={0.15} />
      </section>

      <section aria-label="Custos" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CpcCard data={overview.cpc} delay={0} />
        <CpmCard data={overview.cpm} delay={0.05} />
        <PlatformLeadsCard data={overview.platformLeads} delay={0.1} />
        <CplCard data={overview.cpl} delay={0.15} />
      </section>

      <section aria-label="Resultado real no CRM" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CrmContactsCard data={overview.crmContacts} delay={0} />
        <CplRealCard data={overview.cplReal} series={overview.dailyCplReal} goalMax={goalTarget('cpl_max')} delay={0.05} />
        <AdSalesCard data={overview.adSales} delay={0.1} />
        <RoasCard roas={overview.roas} spend={overview.spend.value} goalMin={goalTarget('roas_min')} delay={0.15} />
      </section>

      <ChartCard title="Investimento diário" description={`Gasto em anúncios por dia, últimos ${overview.windowDays} dias.`} delay={0.1}>
        <DailySpendChart data={overview.dailySpend} />
      </ChartCard>

      <section aria-labelledby="campanhas" className="grid gap-4">
        <div>
          <h2 id="campanhas" className="text-xl font-bold">Campanhas</h2>
          <p className="text-sm text-muted-foreground">Crie uma campanha por plataforma/público; os números de cada uma vêm do registo diário abaixo.</p>
        </div>
        <CampaignsSection campaigns={overview.campaigns} />
      </section>

      <section aria-labelledby="registo-diario" className="grid gap-4">
        <div>
          <h2 id="registo-diario" className="text-xl font-bold">Registo diário</h2>
          <p className="text-sm text-muted-foreground">Insira os números do gestor de anúncios para o dia (impressões, cliques, gasto, leads reportados). Reenviar a mesma data corrige o registo, não duplica.</p>
        </div>
        <MetricsEntryForm campaigns={campaigns} />
      </section>
    </div>
  )
}
