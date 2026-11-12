import { z } from 'zod'

const hex = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor no formato #rrggbb')
// Os campos "avançados" chegam como string vazia quando o utilizador os limpa (voltar ao automático) — normaliza para undefined.
const optionalHex = z
  .union([hex, z.literal('')])
  .optional()
  .transform((v) => (v ? v : undefined))

export const baseTokensSchema = z.object({
  background: hex,
  foreground: hex,
  primary: hex,
  primaryForeground: optionalHex,
  accent: hex,
  accentForeground: optionalHex,
  mutedForeground: hex,
  border: hex,
})

export const themeBaseSchema = z.object({ light: baseTokensSchema, dark: baseTokensSchema })

const fullTokensSchema = z.object({
  background: hex,
  foreground: hex,
  card: hex,
  cardForeground: hex,
  popover: hex,
  popoverForeground: hex,
  primary: hex,
  primaryForeground: hex,
  secondary: hex,
  secondaryForeground: hex,
  muted: hex,
  mutedForeground: hex,
  accent: hex,
  accentForeground: hex,
  border: hex,
  input: hex,
  ring: hex,
  sidebar: hex,
  sidebarForeground: hex,
  sidebarPrimary: hex,
  sidebarPrimaryForeground: hex,
  sidebarAccent: hex,
  sidebarAccentForeground: hex,
  sidebarBorder: hex,
  sidebarRing: hex,
})

/** Forma gravada em `site_content` (chave `theme_palette`): guarda as escolhas originais (`base`) E o resultado já calculado (`resolved`) — só o `resolved` não seria suficiente para reabrir o editor com as escolhas do utilizador, porque a derivação não é invertível. */
export const themePaletteRowSchema = z.object({
  base: themeBaseSchema,
  resolved: z.object({ light: fullTokensSchema, dark: fullTokensSchema }),
})

export type BaseTokensInput = z.infer<typeof baseTokensSchema>
export type ThemeBase = z.infer<typeof themeBaseSchema>
export type ThemePaletteRow = z.infer<typeof themePaletteRowSchema>
