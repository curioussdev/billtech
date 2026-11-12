import type { BaseTokens } from '@/lib/theme/derive'

/**
 * As cores atuais de `globals.css`, calculadas a partir dos mesmos tokens OKLCH — servem para a
 * página nunca abrir vazia (sem personalização gravada) e como alvo exato de "repor predefinições".
 * `border` no escuro é uma aproximação sólida do branco translúcido a 14% que `globals.css` usa de
 * facto (um seletor de cor não representa transparência) — simplificação deliberada da v1.
 */
export const DEFAULT_LIGHT_BASE: BaseTokens = {
  background: '#f2fdfb',
  foreground: '#051212',
  primary: '#006e4f',
  accent: '#46ce83',
  mutedForeground: '#4b5c5c',
  border: '#d8e0df',
}

export const DEFAULT_DARK_BASE: BaseTokens = {
  background: '#000e0d',
  foreground: '#f2f6f5',
  primary: '#008d6b',
  accent: '#59d38c',
  mutedForeground: '#9aacaa',
  border: '#24302f',
}
