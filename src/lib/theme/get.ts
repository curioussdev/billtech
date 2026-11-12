import 'server-only'
import { cache } from 'react'
import { themePaletteRowSchema, type ThemePaletteRow } from '@/lib/theme/schema'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createPublicClient } from '@/lib/supabase/server'

const THEME_PALETTE_KEY = 'theme_palette'

/**
 * Paleta de cores personalizada pelo super admin — `null` quando nunca foi personalizada (o site usa
 * então os valores fixos de `globals.css`). Espelha exatamente `src/lib/content/get.ts::getSiteContent`
 * (cliente sem cookies, para as páginas públicas continuarem estáticas; qualquer falha cai em `null`,
 * nunca lança).
 */
export const getThemePalette = cache(async (): Promise<ThemePaletteRow | null> => {
  if (!isSupabaseConfigured) return null

  try {
    const { data, error } = await createPublicClient().from('site_content').select('value').eq('key', THEME_PALETTE_KEY).maybeSingle()
    if (error || !data) return null
    const parsed = themePaletteRowSchema.safeParse(data.value)
    if (!parsed.success) {
      console.warn('[theme] Paleta personalizada inválida na base de dados; a usar a paleta por omissão.')
      return null
    }
    return parsed.data
  } catch (error) {
    console.error('[theme] Falha a ler theme_palette:', error)
    return null
  }
})

export { THEME_PALETTE_KEY }
