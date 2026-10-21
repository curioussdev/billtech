'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { CAMPAIGN_PLATFORMS, CAMPAIGN_STATUSES } from '@/types/marketing'

/**
 * Server Actions do módulo de Marketing. Mesmo padrão do Financeiro (`src/actions/payments.ts`):
 * `requireAdmin()` → validar com Zod → mutar via `createAdminClient()` → `logAudit` → `revalidatePath`
 * → `{ ok }`. Sem integração com plataformas de anúncios — todos os números são escritos à mão pelo
 * admin (ver nota em `supabase/029_marketing.sql`).
 */

export type MarketingResult = { ok: true } | { ok: false; message: string }

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v)

const campaignSchema = z.object({
  name: z.string().trim().min(3, 'Indique um nome com pelo menos 3 caracteres.').max(120),
  platform: z.enum(CAMPAIGN_PLATFORMS),
  status: z.enum(CAMPAIGN_STATUSES),
  startedAt: z.iso.date(),
  endedAt: z.preprocess(emptyToUndefined, z.iso.date().optional()),
  notes: z.string().trim().max(500).optional().default(''),
})

/** Regista uma nova campanha paga (Meta/Google/TikTok/LinkedIn/outra). */
export async function createCampaign(input: unknown): Promise<MarketingResult> {
  const admin = await requireAdmin()
  const parsed = campaignSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const db = createAdminClient()
  const { data, error } = await db
    .from('campaigns')
    .insert({ name: parsed.data.name, platform: parsed.data.platform, status: parsed.data.status, started_at: parsed.data.startedAt, ended_at: parsed.data.endedAt ?? null, notes: parsed.data.notes, created_by: admin.id })
    .select('id')
    .single()
  if (error) return { ok: false, message: 'Não foi possível criar a campanha.' }

  await logAudit({ admin, action: 'CREATE_CAMPAIGN', resource: 'negocio', targetId: data.id, details: { name: parsed.data.name, platform: parsed.data.platform } })
  revalidatePath('/admin/marketing')
  return { ok: true }
}

const updateCampaignSchema = campaignSchema.extend({ id: z.uuid() })

/** Atualiza os dados de uma campanha já criada (nome, estado, datas, notas). */
export async function updateCampaign(input: unknown): Promise<MarketingResult> {
  const admin = await requireAdmin()
  const parsed = updateCampaignSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const db = createAdminClient()
  const { data: before } = await db.from('campaigns').select('name, platform, status, started_at, ended_at, notes').eq('id', parsed.data.id).maybeSingle()
  const { error } = await db
    .from('campaigns')
    .update({ name: parsed.data.name, platform: parsed.data.platform, status: parsed.data.status, started_at: parsed.data.startedAt, ended_at: parsed.data.endedAt ?? null, notes: parsed.data.notes, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
  if (error) return { ok: false, message: 'Não foi possível atualizar a campanha.' }

  await logAudit({ admin, action: 'UPDATE_CAMPAIGN', resource: 'negocio', targetId: parsed.data.id, details: { before, after: parsed.data } })
  revalidatePath('/admin/marketing')
  return { ok: true }
}

/** Remove uma campanha e as suas métricas diárias (cascade); os leads que lhe eram atribuídos ficam sem campanha, não são apagados. */
export async function deleteCampaign(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const id = z.uuid().safeParse(formData.get('id'))
  if (!id.success) return

  const db = createAdminClient()
  const { data: before } = await db.from('campaigns').select('name, platform').eq('id', id.data).maybeSingle()
  const { error } = await db.from('campaigns').delete().eq('id', id.data)
  if (error) return

  await logAudit({ admin, action: 'DELETE_CAMPAIGN', resource: 'negocio', targetId: id.data, details: { before } })
  revalidatePath('/admin/marketing')
}

const metricsSchema = z.object({
  campaignId: z.uuid(),
  date: z.iso.date(),
  impressions: z.coerce.number('Indique um valor.').int().min(0).max(1_000_000_000),
  clicks: z.coerce.number('Indique um valor.').int().min(0).max(1_000_000_000),
  spend: z.coerce.number('Indique um valor.').min(0).max(1_000_000),
  leadsCount: z.coerce.number('Indique um valor.').int().min(0).max(1_000_000),
})

/** Regista (ou corrige) os números brutos de um dia para uma campanha — upsert por (campanha, data), nunca acumula linhas duplicadas do mesmo dia. */
export async function logCampaignMetrics(input: unknown): Promise<MarketingResult> {
  const admin = await requireAdmin()
  const parsed = metricsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const db = createAdminClient()
  const { error } = await db
    .from('campaign_metrics')
    .upsert(
      { campaign_id: parsed.data.campaignId, date: parsed.data.date, impressions: parsed.data.impressions, clicks: parsed.data.clicks, spend: parsed.data.spend, leads_count: parsed.data.leadsCount, created_by: admin.id },
      { onConflict: 'campaign_id,date' },
    )
  if (error) return { ok: false, message: 'Não foi possível registar as métricas.' }

  await logAudit({ admin, action: 'LOG_CAMPAIGN_METRICS', resource: 'negocio', targetId: parsed.data.campaignId, details: { date: parsed.data.date, spend: parsed.data.spend, impressions: parsed.data.impressions, clicks: parsed.data.clicks, leadsCount: parsed.data.leadsCount } })
  revalidatePath('/admin/marketing')
  return { ok: true }
}
