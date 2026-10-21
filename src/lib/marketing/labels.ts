import type { CampaignPlatform, CampaignStatus } from '@/types/marketing'

export const campaignPlatformLabels: Record<CampaignPlatform, string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
  tiktok: 'TikTok Ads',
  linkedin: 'LinkedIn Ads',
  outro: 'Outra plataforma',
}

export const campaignStatusLabels: Record<CampaignStatus, string> = {
  ativa: 'Ativa',
  pausada: 'Pausada',
  terminada: 'Terminada',
}
