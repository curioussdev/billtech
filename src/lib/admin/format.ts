import { LEAD_CHANNELS, LEAD_STAGES, type LeadChannel, type LeadStage } from '@/types/lead'
import { PROJECT_STATUSES, SECTORS, type ProjectStatus, type Sector } from '@/types/project'

export const sectorLabels: Record<Sector, string> = {
  oficinas: 'Oficinas',
  restauracao: 'Restauração',
  clinicas: 'Clínicas',
  comercio: 'Comércio',
  imobiliario: 'Imobiliário',
  logistica: 'Logística',
  fitness: 'Ginásios',
}

export const projectStatusLabels: Record<ProjectStatus, string> = {
  em_desenvolvimento: 'Em desenvolvimento',
  em_teste: 'Em teste',
  entregue: 'Entregue',
}

export const leadStageLabels: Record<LeadStage, string> = {
  captado: 'Lead Captado',
  qualificado: 'Qualificado',
  proposta: 'Proposta Enviada',
  negociacao: 'Em Negociação',
  ganho: 'Ganho',
  perdido: 'Perdido',
}

export const leadChannelLabels: Record<LeadChannel, string> = {
  organico: 'Orgânico',
  indicacao: 'Indicação',
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
}

// Garante em tempo de compilação que os mapas cobrem todas as chaves
export const allSectors = SECTORS
export const allProjectStatuses = PROJECT_STATUSES
export const allLeadStages = LEAD_STAGES
export const allLeadChannels = LEAD_CHANNELS

const eur = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const compact = new Intl.NumberFormat('pt-PT', { notation: 'compact', maximumFractionDigits: 1 })
const int = new Intl.NumberFormat('pt-PT')

export const formatEUR = (value: number) => eur.format(value)
export const formatCompact = (value: number) => compact.format(value)
export const formatInt = (value: number) => int.format(value)

export const formatPct = (value: number, withSign = false) => {
  const rounded = Math.round(value * 10) / 10
  return `${withSign && rounded > 0 ? '+' : ''}${rounded.toLocaleString('pt-PT')}%`
}

export const formatMonth = (iso: string, style: 'short' | 'long' = 'short') =>
  new Date(iso).toLocaleDateString('pt-PT', { month: style, timeZone: 'UTC' })
