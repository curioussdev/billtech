import type { Sector } from '@/types/project'

export const LEAD_STAGES = ['captado', 'qualificado', 'proposta', 'negociacao', 'ganho', 'perdido'] as const
export type LeadStage = (typeof LEAD_STAGES)[number]

export const LEAD_CHANNELS = ['organico', 'indicacao', 'linkedin', 'whatsapp'] as const
export type LeadChannel = (typeof LEAD_CHANNELS)[number]

export interface Lead {
  id: string
  contactName: string
  company: string
  sector: Sector
  /** Valor estimado do negócio em EUR */
  estimatedValue: number
  stage: LeadStage
  channel: LeadChannel
  /** ISO 8601 — quando entrou no stage atual (dias no stage = hoje − esta data) */
  stageEnteredAt: string
  createdAt: string
  owner: string
  /** Contactos de follow-up já feitos */
  followUps: number
  /** Horas até à primeira resposta ao lead (null = ainda sem resposta) */
  firstResponseHours: number | null
}

export const MEETING_KINDS = ['reuniao', 'demo', 'follow-up'] as const
export type MeetingKind = (typeof MEETING_KINDS)[number]

export interface Meeting {
  id: string
  leadId: string
  title: string
  /** ISO 8601 */
  start: string
  durationMin: number
  kind: MeetingKind
}
