import type { Metadata } from 'next'
import { Forbidden } from '@/components/admin/layout/forbidden'
import { ThemePaletteEditor } from '@/components/admin/definicoes/theme-palette-editor'
import { getSuperAdminOrNull } from '@/lib/auth'
import { DEFAULT_DARK_BASE, DEFAULT_LIGHT_BASE } from '@/lib/theme/defaults'
import { getThemePalette } from '@/lib/theme/get'

export const metadata: Metadata = { title: 'Cores do sistema' }

export default async function ThemeSettingsPage() {
  const admin = await getSuperAdminOrNull()
  if (!admin) return <Forbidden what="A personalização da paleta de cores" />

  const palette = await getThemePalette()

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-black tracking-tight">Cores do sistema</h1>
      <p className="mb-8 mt-2 max-w-2xl text-muted-foreground">
        Escolha as cores principais da marca, veja já como ficam em exemplos reais, e aplique a todo o site — landing, área de cliente e administração — de uma só vez. Nada muda até clicar em
        &quot;Guardar e aplicar&quot;.
      </p>
      <ThemePaletteEditor initialLight={palette?.base.light ?? DEFAULT_LIGHT_BASE} initialDark={palette?.base.dark ?? DEFAULT_DARK_BASE} />
    </div>
  )
}
