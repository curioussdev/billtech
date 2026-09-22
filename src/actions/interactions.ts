'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createAdminClient } from '@/lib/supabase/server'
import { INTERACTION_OUTCOMES, INTERACTION_TYPES } from '@/types/crm'

export type LogInteractionState = { status: 'idle' | 'success' | 'error'; message?: string }

const schema = z.object({
  leadId: z.string().trim().min(1, 'Escolha um lead.').max(60),
  leadLabel: z.string().trim().min(1).max(160),
  type: z.enum(INTERACTION_TYPES, 'Escolha o tipo de interação.'),
  outcome: z.enum(INTERACTION_OUTCOMES, 'Escolha o resultado.'),
  nextStep: z.string().trim().max(200),
  notes: z.string().trim().max(1000),
})

const read = (fd: FormData, key: string) => {
  const v = fd.get(key)
  return typeof v === 'string' ? v : ''
}

/** Fast-Log: regista uma cold call, WhatsApp, reunião, email ou follow-up em <10s. */
export async function logInteraction(_prev: LogInteractionState, formData: FormData): Promise<LogInteractionState> {
  const admin = await requireAdmin()

  const parsed = schema.safeParse({
    leadId: read(formData, 'leadId'),
    leadLabel: read(formData, 'leadLabel'),
    type: read(formData, 'type'),
    outcome: read(formData, 'outcome'),
    nextStep: read(formData, 'nextStep'),
    notes: read(formData, 'notes'),
  })
  if (!parsed.success) return { status: 'error', message: 'Escolha o lead, o tipo e o resultado.' }

  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { status: 'error', message: 'Base de dados não configurada — a interação não foi guardada.' }
  }

  const { error } = await createAdminClient()
    .from('interactions')
    .insert({
      lead_id: parsed.data.leadId,
      lead_label: parsed.data.leadLabel,
      type: parsed.data.type,
      outcome: parsed.data.outcome,
      next_step: parsed.data.nextStep,
      notes: parsed.data.notes,
      admin_email: admin.email,
    })
  if (error) {
    console.error('[crm] logInteraction:', error)
    return { status: 'error', message: 'Não foi possível guardar. Tente novamente.' }
  }

  await logAudit({ admin, action: 'LOG_INTERACTION', resource: 'negocio', targetId: parsed.data.leadId, details: { leadLabel: parsed.data.leadLabel, type: parsed.data.type, outcome: parsed.data.outcome } })
  revalidatePath('/admin/crm')
  return { status: 'success', message: `Interação registada — ${parsed.data.leadLabel}.` }
}
