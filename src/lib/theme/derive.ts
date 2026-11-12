import { hexToOklch, isValidHex, oklchToHex, pickAutoForeground } from '@/lib/theme/oklch'

/** As únicas cores que o super admin escolhe diretamente, por tema. */
export type BaseTokens = {
  background: string
  foreground: string
  primary: string
  primaryForeground?: string
  accent: string
  accentForeground?: string
  mutedForeground: string
  border: string
}

/** Todos os tokens CSS gerados a partir de `BaseTokens` — lista fechada, nunca inclui as séries de gráfico nem a banda "inverse". */
export type FullTokens = {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  border: string
  input: string
  ring: string
  sidebar: string
  sidebarForeground: string
  sidebarPrimary: string
  sidebarPrimaryForeground: string
  sidebarAccent: string
  sidebarAccentForeground: string
  sidebarBorder: string
  sidebarRing: string
}

export const LIGHT_THEME_KEYS = [
  'background',
  'foreground',
  'card',
  'cardForeground',
  'popover',
  'popoverForeground',
  'primary',
  'primaryForeground',
  'secondary',
  'secondaryForeground',
  'muted',
  'mutedForeground',
  'accent',
  'accentForeground',
  'border',
  'input',
  'ring',
  'sidebar',
  'sidebarForeground',
  'sidebarPrimary',
  'sidebarPrimaryForeground',
  'sidebarAccent',
  'sidebarAccentForeground',
  'sidebarBorder',
  'sidebarRing',
] as const satisfies readonly (keyof FullTokens)[]

export const DARK_THEME_KEYS = LIGHT_THEME_KEYS

/** camelCase -> nome da variável CSS (ex.: primaryForeground -> --primary-foreground). */
export function cssVarName(key: string): string {
  return '--' + key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
}

function withAutoForeground(override: string | undefined, fallback: () => string): string {
  return override && isValidHex(override) ? override : fallback()
}

/**
 * Deriva o conjunto completo de tokens a partir das poucas cores escolhidas, com os mesmos passos de
 * luminosidade perceptual (OKLCH) usados para construir a paleta atual à mão. `sidebar-accent` deriva
 * de `primary` (não de `accent`) — é assim na paleta atual, apesar do nome do token.
 */
export function deriveFullTokens(base: BaseTokens): FullTokens {
  const { l: bgL } = hexToOklch(base.background)
  const isDarkTheme = bgL < 0.5

  // Card/popover: "levantados" em relação ao fundo — mais claros que o fundo em modo escuro, quase brancos em modo claro.
  const card = isDarkTheme ? withLightnessStep(base.background, 0.06) : '#ffffff'
  const popover = card

  // Secondary/muted: tom neutro muito próximo do fundo (mesmo matiz, pequeno passo de luminosidade).
  const secondary = withLightnessStep(base.background, isDarkTheme ? 0.12 : -0.025)
  const muted = withLightnessStep(base.background, isDarkTheme ? 0.09 : -0.03)

  const primaryForeground = withAutoForeground(base.primaryForeground, () => pickAutoForeground(base.primary))
  const accentForeground = withAutoForeground(base.accentForeground, () => pickAutoForeground(base.accent))

  // Sidebar: espelha a família do fundo/primary, com um tom claro de primary como "accent" (não o accent da marca).
  const sidebarAccent = withLightnessStep(base.primary, isDarkTheme ? -0.29 : 0.49)
  const sidebarAccentForeground = withLightnessStep(base.primary, isDarkTheme ? 0.36 : -0.16)

  return {
    background: base.background,
    foreground: base.foreground,
    card,
    cardForeground: base.foreground,
    popover,
    popoverForeground: base.foreground,
    primary: base.primary,
    primaryForeground,
    secondary,
    secondaryForeground: base.foreground,
    muted,
    mutedForeground: base.mutedForeground,
    accent: base.accent,
    accentForeground,
    border: base.border,
    input: base.border,
    ring: base.primary,
    sidebar: isDarkTheme ? withLightnessStep(base.background, 0.04) : withLightnessStep(base.background, 0.005),
    sidebarForeground: base.foreground,
    sidebarPrimary: base.primary,
    sidebarPrimaryForeground: primaryForeground,
    sidebarAccent,
    sidebarAccentForeground,
    sidebarBorder: base.border,
    sidebarRing: base.primary,
  }
}

function withLightnessStep(hex: string, delta: number): string {
  const { l, c, h } = hexToOklch(hex)
  return oklchToHex({ l: Math.min(1, Math.max(0, l + delta)), c, h })
}
