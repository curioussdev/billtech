import { mockLeads } from '@/data/mock/leads'
import { MOCK_NOW } from '@/data/mock/projects'
import { isoWeekKey } from '@/lib/crm/analytics'
import type { Goal, Interaction, InteractionOutcome, InteractionType } from '@/types/crm'
import type { LeadChannel } from '@/types/lead'

/**
 * DADOS DE DEMONSTRAÇÃO — gerados de forma determinística (sem `Math.random`) a partir dos 26 leads
 * já existentes em `src/data/mock/leads.ts`, para as métricas baterem certo com o que a Pipeline e a
 * Prospecção já mostram (`followUps`, `firstResponseHours`, `stage`, `stageEnteredAt`). Não recriámos
 * "50 leads" novos: o pedido original pedia esse volume porque ainda não existia nenhum lead — aqui já
 * havia 26, e duplicá-los só para bater com um número teria criado dois catálogos de leads a divergir.
 */

const DAY_MS = 86_400_000
const NEXT_STEPS = [
  'Ligar amanhã de manhã',
  'Enviar catálogo de serviços',
  'Confirmar orçamento por email',
  'Agendar demonstração',
  'Enviar proposta revista',
  'Confirmar decisor da compra',
  'Reforçar por WhatsApp',
  'Pedir referências do setor',
]

const FIRST_TOUCH_TYPE: Record<LeadChannel, InteractionType> = { organico: 'email', indicacao: 'cold_call', linkedin: 'email', whatsapp: 'whatsapp' }
const FOLLOWUP_TYPE: Record<LeadChannel, InteractionType> = { organico: 'cold_call', indicacao: 'cold_call', linkedin: 'cold_call', whatsapp: 'whatsapp' }

function buildInteractions(lead: (typeof mockLeads)[number]): Interaction[] {
  const out: Interaction[] = []
  let seq = 0
  const push = (occurredAt: string, type: InteractionType, outcome: InteractionOutcome, extra: Partial<Pick<Interaction, 'durationMin' | 'notes' | 'nextStep'>> = {}) => {
    seq += 1
    out.push({
      id: `${lead.id}-i${seq}`,
      leadId: lead.id,
      leadLabel: lead.company,
      type,
      occurredAt,
      durationMin: extra.durationMin ?? null,
      outcome,
      notes: extra.notes ?? '',
      nextStep: extra.nextStep ?? '',
      createdAt: occurredAt,
    })
  }

  const createdMs = new Date(lead.createdAt).getTime()
  const stageEnteredMs = new Date(lead.stageEnteredAt).getTime()
  const span = Math.max(stageEnteredMs - createdMs, DAY_MS)

  // 1) Primeiro toque, no canal de origem do lead
  const firstType = FIRST_TOUCH_TYPE[lead.channel]
  push(lead.createdAt, firstType, lead.firstResponseHours === null ? 'sem_resposta' : 'interessado', {
    durationMin: firstType === 'cold_call' ? 3 : null,
    notes: 'Primeiro contacto.',
  })

  // 2) Resposta do lead (se já respondeu)
  if (lead.firstResponseHours !== null) {
    const respondedAt = new Date(createdMs + lead.firstResponseHours * 3_600_000).toISOString()
    push(respondedAt, lead.channel === 'whatsapp' ? 'whatsapp' : 'cold_call', 'interessado', { durationMin: 5, notes: 'Respondeu ao primeiro contacto.' })
  }

  // 3) Follow-ups (um por cada unidade em lead.followUps), espaçados até à etapa atual
  const followType = FOLLOWUP_TYPE[lead.channel]
  // Inclui 'perdido': na prática quase ninguém é marcado como perdido sem antes ver uma reunião/proposta.
  const advanced = lead.stage === 'proposta' || lead.stage === 'negociacao' || lead.stage === 'ganho' || lead.stage === 'perdido'
  for (let i = 0; i < lead.followUps; i++) {
    const at = createdMs + span * ((i + 1) / (lead.followUps + 2))
    // O follow-up que antecede a reunião de apresentação (abaixo) é o que "agendou": alimenta o hit-rate de cold calls.
    const isLastBeforeMeeting = advanced && i === lead.followUps - 1
    const outcome: InteractionOutcome = isLastBeforeMeeting ? 'agendado' : i % 2 === 0 ? 'interessado' : 'sem_resposta'
    push(new Date(at).toISOString(), followType, outcome, {
      durationMin: followType === 'cold_call' ? 4 : null,
      notes: `Follow-up ${i + 1}.`,
      nextStep: NEXT_STEPS[(Number(lead.id.slice(1)) + i) % NEXT_STEPS.length],
    })
  }

  // 4) Reunião de apresentação para leads mais avançados no funil
  if (advanced) {
    push(new Date(createdMs + span * 0.7).toISOString(), 'reuniao', 'agendado', { durationMin: 30, notes: 'Reunião de apresentação da proposta.' })
  }

  // 5) Desfecho
  if (lead.stage === 'ganho') {
    push(lead.stageEnteredAt, 'reuniao', 'sucesso', { durationMin: 45, notes: 'Contrato assinado.' })
  } else if (lead.stage === 'perdido') {
    push(lead.stageEnteredAt, followType, 'nao_interessado', { notes: 'Cliente optou por não avançar.' })
  }

  return out
}

/**
 * Sessão de prospecção "de hoje" (dia de referência dos mocks, 2026-09-21). Sem isto, a métrica de
 * "cold calls hoje" ficaria sempre a zero, porque o histórico acima está espalhado pelos últimos ~90
 * dias. Representa uma sessão real de chamadas a leads ainda no início do funil (32 chamadas, 2 delas
 * a render em reunião marcada — os mesmos números do pedido original, "32 / 50").
 */
function buildTodaySession(): Interaction[] {
  const today = MOCK_NOW.slice(0, 10)
  const earlyStage = mockLeads.filter((l) => l.stage === 'captado' || l.stage === 'qualificado')
  const CALLS = 32
  const MEETINGS_BOOKED = 2
  // MOCK_NOW é às 10:00 UTC — a sessão tem de caber ANTES disso (07:00–09:53), senão "hoje" teria
  // chamadas no futuro face ao "agora" do próprio mock. Um blitz de chamadas ao início da manhã.
  const START_MINUTES = 7 * 60
  const WINDOW_MINUTES = 170

  return Array.from({ length: CALLS }, (_, i) => {
    const lead = earlyStage[i % earlyStage.length]
    const totalMinutes = START_MINUTES + Math.round((i * WINDOW_MINUTES) / CALLS)
    const hour = Math.floor(totalMinutes / 60)
    const minute = totalMinutes % 60
    const occurredAt = `${today}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`
    const outcome: InteractionOutcome = i < MEETINGS_BOOKED ? 'agendado' : i % 3 === 0 ? 'interessado' : 'sem_resposta'
    return {
      id: `today-i${i + 1}`,
      leadId: lead.id,
      leadLabel: lead.company,
      type: 'cold_call' as const,
      occurredAt,
      durationMin: 3,
      outcome,
      notes: 'Sessão de prospecção de hoje.',
      nextStep: outcome === 'agendado' ? 'Confirmar reunião amanhã' : outcome === 'interessado' ? 'Voltar a ligar em 2 dias' : 'Tentar novamente amanhã',
      createdAt: occurredAt,
    }
  })
}

export const mockInteractions: Interaction[] = [...mockLeads.flatMap(buildInteractions), ...buildTodaySession()]

const now = new Date(MOCK_NOW)
const dayKey = now.toISOString().slice(0, 10)
const weekKey = isoWeekKey(now)
const monthKey = now.toISOString().slice(0, 7)
const yearKey = String(now.getUTCFullYear())

/**
 * Metas configuradas conforme o pedido original. Números ambiciosos de propósito (50 cold calls/dia):
 * são a meta do José, não uma média histórica — os cartões de pace mostram o hiato real face a isto.
 */
export const mockGoals: Goal[] = [
  { id: 'g-daily-calls', periodType: 'diaria', metric: 'cold_calls', target: 50, period: dayKey, createdAt: MOCK_NOW, updatedAt: MOCK_NOW },
  { id: 'g-daily-meetings', periodType: 'diaria', metric: 'meetings', target: 2, period: dayKey, createdAt: MOCK_NOW, updatedAt: MOCK_NOW },
  { id: 'g-weekly-calls', periodType: 'semanal', metric: 'cold_calls', target: 250, period: weekKey, createdAt: MOCK_NOW, updatedAt: MOCK_NOW },
  { id: 'g-weekly-meetings', periodType: 'semanal', metric: 'meetings', target: 10, period: weekKey, createdAt: MOCK_NOW, updatedAt: MOCK_NOW },
  { id: 'g-weekly-proposals', periodType: 'semanal', metric: 'proposals_value', target: 5000, period: weekKey, createdAt: MOCK_NOW, updatedAt: MOCK_NOW },
  { id: 'g-monthly-revenue', periodType: 'mensal', metric: 'revenue', target: 20_000, period: monthKey, createdAt: MOCK_NOW, updatedAt: MOCK_NOW },
  { id: 'g-monthly-winrate', periodType: 'mensal', metric: 'win_rate', target: 30, period: monthKey, createdAt: MOCK_NOW, updatedAt: MOCK_NOW },
  { id: 'g-yearly-revenue', periodType: 'anual', metric: 'revenue', target: 240_000, period: yearKey, createdAt: MOCK_NOW, updatedAt: MOCK_NOW },
]
