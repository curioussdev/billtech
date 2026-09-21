'use server'

import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { LEAD_STAGES } from '@/types/lead'

const schema = z.object({ leadId: z.string().min(1).max(60), stage: z.enum(LEAD_STAGES) })

export type LeadMoveResult = { ok: true } | { ok: false; message: string }

/**
 * Move um lead de etapa do funil.
 *
 * TODO(persistência): os leads ainda vivem em `src/data/mock/`, por isso a mudança só existe na sessão do
 * browser. Ao ligar o Prisma/PostgreSQL: gravar `stage` + `stageEnteredAt` aqui e registar em `logAudit`
 * (ação MOVE_LEAD). Não auditamos já para não encher a trilha imutável com dados de demonstração.
 */
export async function moveLead(leadId: string, stage: string): Promise<LeadMoveResult> {
  await requireAdmin()
  const parsed = schema.safeParse({ leadId, stage })
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' }
  return { ok: true }
}
