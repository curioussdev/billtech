'use server'

import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit'
import { FORBIDDEN_MESSAGE, requireSuperAdminForAction } from '@/lib/auth'
import { deriveFullTokens } from '@/lib/theme/derive'
import { THEME_PALETTE_KEY } from '@/lib/theme/get'
import { themeBaseSchema, type ThemeBase } from '@/lib/theme/schema'
import { createClient } from '@/lib/supabase/server'

export type ThemeResult = { ok: true } | { ok: false; message: string }

/** Afeta todo o site de imediato: landing, portal, admin — ver `src/app/layout.tsx`. */
const refreshSite = () => revalidatePath('/', 'layout')

export async function saveThemePalette(input: unknown): Promise<ThemeResult> {
  const admin = await requireSuperAdminForAction({ action: 'UPDATE_THEME_PALETTE', resource: 'definicoes' })
  if (!admin) return { ok: false, message: FORBIDDEN_MESSAGE }

  const parsed = themeBaseSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Cores inválidas — confirme que todos os campos têm um código #rrggbb válido.' }

  const base: ThemeBase = parsed.data
  const resolved = { light: deriveFullTokens(base.light), dark: deriveFullTokens(base.dark) }

  const supabase = await createClient()
  const { data: existing } = await supabase.from('site_content').select('value').eq('key', THEME_PALETTE_KEY).maybeSingle()
  const { error } = await supabase.from('site_content').upsert({ key: THEME_PALETTE_KEY, value: { base, resolved }, updated_at: new Date().toISOString() })
  if (error) return { ok: false, message: `Não foi possível guardar: ${error.message}` }

  await logAudit({ admin, action: 'UPDATE_THEME_PALETTE', resource: 'definicoes', targetId: THEME_PALETTE_KEY, details: { reset: false, before: existing?.value ?? null, after: base } })
  refreshSite()
  return { ok: true }
}

export async function resetThemePalette(): Promise<ThemeResult> {
  const admin = await requireSuperAdminForAction({ action: 'UPDATE_THEME_PALETTE', resource: 'definicoes' })
  if (!admin) return { ok: false, message: FORBIDDEN_MESSAGE }

  const supabase = await createClient()
  const { data: existing } = await supabase.from('site_content').select('value').eq('key', THEME_PALETTE_KEY).maybeSingle()
  const { error } = await supabase.from('site_content').delete().eq('key', THEME_PALETTE_KEY)
  if (error) return { ok: false, message: `Não foi possível repor: ${error.message}` }

  await logAudit({ admin, action: 'UPDATE_THEME_PALETTE', resource: 'definicoes', targetId: THEME_PALETTE_KEY, details: { reset: true, before: existing?.value ?? null } })
  refreshSite()
  return { ok: true }
}
