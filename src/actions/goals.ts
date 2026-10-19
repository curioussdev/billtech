'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createAdminClient } from '@/lib/supabase/server'
import { GOAL_METRICS, GOAL_PERIOD_TYPES } from '@/types/crm'

const isLive = () => isSupabaseConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

const schema = z.object({
  periodType: z.enum(GOAL_PERIOD_TYPES),
  metric: z.enum(GOAL_METRICS),
  period: z.string().min(1).max(20),
  target: z.coerce.number('Indique um valor.').min(0).max(10_000_000),
})

/** Define/atualiza a meta de um período (diária/semanal/mensal/anual) e métrica — alimenta os cartões de pace do Escritório Virtual. */
export async function upsertGoal(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const parsed = schema.safeParse({
    periodType: formData.get('periodType'),
    metric: formData.get('metric'),
    period: formData.get('period'),
    target: formData.get('target'),
  })
  if (!parsed.success) return
  const { periodType, metric, period, target } = parsed.data

  if (isLive()) {
    const db = createAdminClient()
    const { data: before } = await db.from('goals').select('target').eq('period_type', periodType).eq('metric', metric).eq('period', period).maybeSingle()
    const { error } = await db
      .from('goals')
      .upsert({ period_type: periodType, metric, period, target, updated_at: new Date().toISOString() }, { onConflict: 'period_type,metric,period' })
    if (error) {
      console.error('[crm] gravação de meta falhou:', error)
      return
    }
    await logAudit({ admin, action: 'SET_GOAL', resource: 'negocio', targetId: `${periodType}:${metric}:${period}`, details: { before: before?.target ?? null, after: target } })
  }

  revalidatePath('/admin/crm')
  revalidatePath('/admin/crm/metas')
}
