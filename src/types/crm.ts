/**
 * Tipos do "Escritório Virtual" (CRM): follow-up, cold calls e metas.
 *
 * Adaptação ao que já existe: `Lead`, `LeadStage`, `LeadChannel` e `Meeting` já vivem em
 * `@/types/lead` (criados na Etapa 2 do módulo de negócio) — não duplicamos aqui. O `Deal` do
 * pedido original (Prisma) mapeia para o próprio `Lead` quando chega a `ganho`/`perdido`: em vez de
 * uma tabela paralela, os campos `projectName`/`projectType`/`lossReason` (abaixo, opcionais) foram
 * anexados ao `Lead` existente, porque o Kanban de 6 etapas já criado ("Pipeline de Vendas") FAZ de
 * Deal Board — um segundo quadro com 3 colunas seria um duplicado, não um complemento.
 */

export const INTERACTION_TYPES = ['cold_call', 'whatsapp', 'reuniao', 'email', 'follow_up'] as const
export type InteractionType = (typeof INTERACTION_TYPES)[number]

export const INTERACTION_OUTCOMES = ['sucesso', 'sem_resposta', 'interessado', 'nao_interessado', 'agendado'] as const
export type InteractionOutcome = (typeof INTERACTION_OUTCOMES)[number]

export interface Interaction {
  id: string
  leadId: string
  /** Nome da empresa no momento do registo — os leads ainda não têm tabela própria (ver nota acima), por isso guardamos uma cópia em vez de um JOIN. */
  leadLabel: string
  type: InteractionType
  /** ISO 8601 — quando a interação aconteceu (pode ser lançada com atraso) */
  occurredAt: string
  durationMin: number | null
  outcome: InteractionOutcome
  notes: string
  nextStep: string
  createdAt: string
}

export const LOSS_REASONS = ['preco', 'timing', 'concorrente', 'nao_respondeu', 'outro'] as const
export type LossReason = (typeof LOSS_REASONS)[number]

export const DEAL_PROJECT_TYPES = ['Web App', 'Mobile App', 'Dashboard', 'Automação'] as const
export type DealProjectType = (typeof DEAL_PROJECT_TYPES)[number]

export const GOAL_PERIOD_TYPES = ['diaria', 'semanal', 'mensal', 'anual'] as const
export type GoalPeriodType = (typeof GOAL_PERIOD_TYPES)[number]

/** `win_rate` e `proposals_value` são extensões ao pedido original (ColdCalls/Revenue/ConversionRate/Meetings), para cobrir a meta mensal de "30% win rate" e a meta semanal de "€5.000 em propostas". */
export const GOAL_METRICS = ['cold_calls', 'meetings', 'revenue', 'win_rate', 'proposals_value'] as const
export type GoalMetric = (typeof GOAL_METRICS)[number]

export interface Goal {
  id: string
  periodType: GoalPeriodType
  metric: GoalMetric
  target: number
  /** Chave do período: 'AAAA-MM-DD' (diária) · 'AAAA-Wss' ISO (semanal) · 'AAAA-MM' (mensal) · 'AAAA' (anual) */
  period: string
  createdAt: string
  updatedAt: string
}
