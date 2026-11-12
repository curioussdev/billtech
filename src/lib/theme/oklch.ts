/**
 * Conversão hex↔OKLCH e contraste WCAG — sem dependências externas. Usado para derivar os tokens
 * "secundários" (card, muted, sidebar, …) a partir das poucas cores que o super admin escolhe, com
 * passos de luminosidade perceptualmente uniformes (o que o OKLCH garante e o HSL não), e para avisar
 * de contraste insuficiente no pré-visualizador — essa segunda parte usa a luminância relativa sRGB
 * real da fórmula WCAG, que NÃO é o mesmo cálculo que o `L` do OKLCH.
 */

export type Oklch = { l: number; c: number; h: number }

export const isValidHex = (value: string): boolean => /^#[0-9a-fA-F]{6}$/.test(value.trim())

function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '')
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp255 = (c: number) => Math.round(Math.min(255, Math.max(0, c)))
  return '#' + [r, g, b].map((c) => clamp255(c).toString(16).padStart(2, '0')).join('')
}

function srgbToLinear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function linearToSrgb(c: number): number {
  const clamped = Math.min(1, Math.max(0, c))
  return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055
}

export function hexToOklch(hex: string): Oklch {
  const [r8, g8, b8] = hexToRgb(hex)
  const r = srgbToLinear(r8)
  const g = srgbToLinear(g8)
  const b = srgbToLinear(b8)

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b

  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

  const C = Math.sqrt(a * a + bb * bb)
  let H = (Math.atan2(bb, a) * 180) / Math.PI
  if (H < 0) H += 360
  return { l: L, c: C, h: H }
}

/** Gamut sRGB: depois de ajustar a luminosidade, a cor pode cair fora do intervalo representável — recorta cada canal, não deixa sair um valor inválido/estranho em silêncio. */
export function oklchToHex({ l, c, h }: Oklch): string {
  const hRad = (h * Math.PI) / 180
  const a = c * Math.cos(hRad)
  const b = c * Math.sin(hRad)

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b

  const ll = l_ ** 3
  const mm = m_ ** 3
  const ss = s_ ** 3

  const r = 4.0767416621 * ll - 3.3077115913 * mm + 0.2309699292 * ss
  const g = -1.2684380046 * ll + 2.6097574011 * mm - 0.3413193965 * ss
  const bl = -0.0041960863 * ll - 0.7034186147 * mm + 1.707614701 * ss

  return rgbToHex(linearToSrgb(r) * 255, linearToSrgb(g) * 255, linearToSrgb(bl) * 255)
}

/** Ajusta só a luminosidade de uma cor, mantendo o seu matiz/saturação — usado para derivar card/muted/sidebar a partir das cores escolhidas. */
export function withLightness(hex: string, l: number): string {
  const { c, h } = hexToOklch(hex)
  return oklchToHex({ l: Math.min(1, Math.max(0, l)), c, h })
}

/** Luminância relativa sRGB (fórmula WCAG, não o `L` perceptual do OKLCH). */
export function relativeLuminance(hex: string): number {
  const [r8, g8, b8] = hexToRgb(hex)
  return 0.2126 * srgbToLinear(r8) + 0.7152 * srgbToLinear(g8) + 0.0722 * srgbToLinear(b8)
}

/** Razão de contraste WCAG entre duas cores (1–21). */
export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA)
  const lumB = relativeLuminance(hexB)
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Escolhe texto quase-preto ou quase-branco consoante o que der mais contraste contra o fundo dado — o mesmo princípio do token "on-primary" do Material Design. */
export function pickAutoForeground(backgroundHex: string): string {
  const darkCandidate = '#0a0a0a'
  const lightCandidate = '#fafafa'
  return contrastRatio(darkCandidate, backgroundHex) >= contrastRatio(lightCandidate, backgroundHex) ? darkCandidate : lightCandidate
}
