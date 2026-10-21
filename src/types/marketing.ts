/**
 * Tipos do módulo de Marketing: campanhas pagas e métricas diárias brutas.
 * Segue o padrão de src/types/crm.ts / src/types/lead.ts — constantes `as const` + tipo derivado,
 * sem motor de validação próprio (isso fica nos Server Actions, com Zod a ler estas constantes).
 */

export const CAMPAIGN_PLATFORMS = ['meta', 'google', 'tiktok', 'linkedin', 'outro'] as const
export type CampaignPlatform = (typeof CAMPAIGN_PLATFORMS)[number]

export const CAMPAIGN_STATUSES = ['ativa', 'pausada', 'terminada'] as const
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]

export interface Campaign {
  id: string
  name: string
  platform: CampaignPlatform
  status: CampaignStatus
  /** ISO date (AAAA-MM-DD) */
  startedAt: string
  endedAt: string | null
  notes: string
  createdAt: string
  updatedAt: string
}

export interface CampaignDailyMetric {
  id: string
  campaignId: string
  /** ISO date (AAAA-MM-DD) */
  date: string
  impressions: number
  clicks: number
  spend: number
  leadsCount: number
  createdAt: string
}
