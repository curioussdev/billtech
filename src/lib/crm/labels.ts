import type { DealProjectType, GoalMetric, GoalPeriodType, InteractionOutcome, InteractionType, LossReason } from '@/types/crm'

export const interactionTypeLabels: Record<InteractionType, string> = {
  cold_call: 'Cold Call',
  whatsapp: 'WhatsApp',
  reuniao: 'Reunião',
  email: 'Email',
  follow_up: 'Follow-up',
}

export const interactionOutcomeLabels: Record<InteractionOutcome, string> = {
  sucesso: 'Sucesso',
  sem_resposta: 'Sem resposta',
  interessado: 'Interessado',
  nao_interessado: 'Não interessado',
  agendado: 'Agendado',
}

export const lossReasonLabels: Record<LossReason, string> = {
  preco: 'Preço',
  timing: 'Timing',
  concorrente: 'Concorrente',
  nao_respondeu: 'Não respondeu',
  outro: 'Outro',
}

export const goalPeriodLabels: Record<GoalPeriodType, string> = {
  diaria: 'Diária',
  semanal: 'Semanal',
  mensal: 'Mensal',
  anual: 'Anual',
}

export const goalMetricLabels: Record<GoalMetric, string> = {
  cold_calls: 'Cold Calls',
  meetings: 'Reuniões agendadas',
  revenue: 'Receita',
  win_rate: 'Win Rate',
  proposals_value: 'Valor em propostas enviadas',
}

export const dealProjectTypeLabels: Record<DealProjectType, string> = {
  'Web App': 'Web App',
  'Mobile App': 'Mobile App',
  Dashboard: 'Dashboard',
  Automação: 'Automação',
}
