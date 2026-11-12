import { cssVarName, DARK_THEME_KEYS, LIGHT_THEME_KEYS, type FullTokens } from '@/lib/theme/derive'
import { isValidHex } from '@/lib/theme/oklch'
import type { ThemePaletteRow } from '@/lib/theme/schema'

function block(selector: string, tokens: FullTokens, keys: readonly (keyof FullTokens)[]): string {
  const declarations = keys
    .filter((key) => isValidHex(tokens[key]))
    .map((key) => `${cssVarName(key)}:${tokens[key]}`)
    .join(';')
  return declarations ? `${selector}{${declarations}}` : ''
}

/**
 * CSS da paleta personalizada, para injetar no `<body>` do layout raiz. Revalida cada valor contra
 * `isValidHex` mesmo vindo de dados já validados ao guardar (defesa em profundidade), e só percorre a
 * lista fechada de chaves que este sistema pode gerar — nunca séries de gráfico nem a banda "inverse".
 * Devolve string vazia (sem `<style>` nenhum) quando não há paleta personalizada.
 */
export function buildThemeOverrideCss(palette: ThemePaletteRow | null): string {
  if (!palette) return ''
  const light = block(':root', palette.resolved.light, LIGHT_THEME_KEYS)
  const dark = block('.dark', palette.resolved.dark, DARK_THEME_KEYS)
  return light + dark
}
