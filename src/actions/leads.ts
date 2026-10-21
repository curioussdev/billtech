'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createAdminClient } from '@/lib/supabase/server'
import { LEAD_CHANNELS } from '@/types/lead'
import { SECTORS } from '@/types/project'

const isLive = () => isSupabaseConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

const schema = z.object({
  contactName: z.string().trim().min(2, 'Indique o nome do contacto.').max(160),
  company: z.string().trim().min(2, 'Indique o nome da empresa.').max(160),
  sector: z.enum(SECTORS, 'Escolha um setor.'),
  channel: z.enum(LEAD_CHANNELS, 'Escolha uma origem.'),
  estimatedValue: z.coerce.number().min(0).max(1_000_000).default(0),
})

export type CreateLeadResult = { ok: true } | { ok: false; message: string }

/** Cria um lead manualmente (cold call feito antes de ligar, indicação, prospeção ativa) — sem depender do formulário da landing. */
export async function createLead(input: unknown): Promise<CreateLeadResult> {
  const admin = await requireAdmin()
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  if (isLive()) {
    const db = createAdminClient()
    const { data: lead, error } = await db
      .from('leads')
      .insert({
        contact_name: parsed.data.contactName,
        company: parsed.data.company,
        sector: parsed.data.sector,
        channel: parsed.data.channel,
        estimated_value: parsed.data.estimatedValue,
        owner: admin.email,
      })
      .select('id')
      .single()
    if (error || !lead) {
      console.error('[pipeline] criação de lead falhou:', error)
      return { ok: false, message: 'Não foi possível criar o lead.' }
    }

    // Captar um lead já É o esforço de cold call (ligar/abordar antes de o registar) — conta
    // automaticamente para a meta diária, em vez de exigir um segundo registo manual no Fast-Log.
    const { error: interactionError } = await db.from('interactions').insert({
      lead_id: lead.id,
      lead_label: parsed.data.company,
      type: 'cold_call',
      occurred_at: new Date().toISOString(),
      outcome: 'interessado',
      notes: 'Cold call automática — contabilizada ao criar o lead.',
      admin_id: admin.id,
      admin_email: admin.email,
    })
    if (interactionError) console.error('[pipeline] registo automático de cold call falhou:', interactionError)
  }

  await logAudit({ admin, action: 'CREATE_LEAD', resource: 'negocio', details: parsed.data })
  revalidatePath('/admin/pipeline')
  revalidatePath('/admin/prospecting')
  revalidatePath('/admin/crm')
  revalidatePath('/admin', 'layout')
  return { ok: true }
}
