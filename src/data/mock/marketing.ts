import { MOCK_NOW } from '@/data/mock/projects'
import type { Campaign, CampaignDailyMetric } from '@/types/marketing'

/**
 * DADOS DE DEMONSTRAÇÃO — gerados de forma determinística (sem `Math.random`), ancorados em
 * `MOCK_NOW` (2026-09-21), para a UI do módulo de Marketing (Fase 2) ter o que mostrar antes de
 * existirem campanhas reais registadas pelo admin.
 */

const DAY_MS = 86_400_000
const now = new Date(MOCK_NOW)
const daysAgo = (n: number) => new Date(now.getTime() - n * DAY_MS).toISOString().slice(0, 10)

export const mockCampaigns: Campaign[] = [
  {
    id: 'camp-meta-oficinas',
    name: 'Meta Ads — Oficinas Lisboa',
    platform: 'meta',
    status: 'ativa',
    startedAt: daysAgo(45),
    endedAt: null,
    notes: 'Segmentação por interesse em manutenção automóvel, raio de 30km de Lisboa.',
    createdAt: daysAgo(45),
    updatedAt: daysAgo(1),
  },
  {
    id: 'camp-google-pesquisa',
    name: 'Google Ads — Pesquisa Local',
    platform: 'google',
    status: 'ativa',
    startedAt: daysAgo(30),
    endedAt: null,
    notes: 'Campanha de pesquisa, termos "software para [setor] perto de mim".',
    createdAt: daysAgo(30),
    updatedAt: daysAgo(1),
  },
  {
    id: 'camp-tiktok-teste',
    name: 'TikTok Ads — Teste de criativos',
    platform: 'tiktok',
    status: 'pausada',
    startedAt: daysAgo(60),
    endedAt: daysAgo(35),
    notes: 'Teste de 4 semanas para avaliar o canal; pausada por CPL acima do aceitável.',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(35),
  },
]

/** Série diária determinística: `base + (dayIndex % 7) * step`, sem Math.random. Termina `endDaysAgo` dias antes de MOCK_NOW (0 = hoje). */
function buildSeries(campaignId: string, days: number, endDaysAgo: number, base: { impressions: number; clicks: number; spend: number; leadsCount: number }, step: { impressions: number; clicks: number; spend: number }): CampaignDailyMetric[] {
  return Array.from({ length: days }, (_, i) => {
    const cycle = i % 7
    const offset = days - i + endDaysAgo
    return {
      id: `${campaignId}-m${i + 1}`,
      campaignId,
      date: daysAgo(offset),
      impressions: base.impressions + cycle * step.impressions,
      clicks: base.clicks + cycle * step.clicks,
      spend: Math.round((base.spend + cycle * step.spend) * 100) / 100,
      leadsCount: cycle === 0 || cycle === 3 ? base.leadsCount + 1 : base.leadsCount,
      createdAt: daysAgo(offset),
    }
  })
}

export const mockCampaignMetrics: CampaignDailyMetric[] = [
  ...buildSeries('camp-meta-oficinas', 45, 0, { impressions: 1800, clicks: 54, spend: 32, leadsCount: 1 }, { impressions: 220, clicks: 9, spend: 4 }),
  ...buildSeries('camp-google-pesquisa', 30, 0, { impressions: 900, clicks: 38, spend: 41, leadsCount: 1 }, { impressions: 110, clicks: 6, spend: 5 }),
  ...buildSeries('camp-tiktok-teste', 25, 35, { impressions: 4200, clicks: 61, spend: 28, leadsCount: 0 }, { impressions: 300, clicks: 4, spend: 3 }),
]
