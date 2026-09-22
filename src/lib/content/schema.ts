import { z } from 'zod'
import { iconNames } from '@/lib/icons'

// ─── Validadores partilhados ───────────────────────────────────────────────

const ALLOWED_IMAGE_HOSTS = ['images.unsplash.com']
const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null
  } catch {
    return null
  }
})()

/** next/image só aceita domínios configurados em next.config.mjs; validar evita páginas partidas. */
export function isAllowedImage(src: string) {
  if (src.startsWith('/') && !src.startsWith('//')) return true
  try {
    const { protocol, hostname } = new URL(src)
    return protocol === 'https:' && [...ALLOWED_IMAGE_HOSTS, supabaseHost].includes(hostname)
  } catch {
    return false
  }
}

const text = z.string().trim().max(400)
const longText = z.string().trim().max(3000)
const label = z.string().trim().min(1, 'Obrigatório').max(160)
// Bloqueia esquemas perigosos como javascript:
const url = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(v), 'Use um link http(s)://, mailto: ou tel:')
const icon = z.enum(iconNames)

export const imageSchema = z.object({
  src: z
    .string()
    .trim()
    .min(1, 'Escolha ou carregue uma imagem')
    .refine(isAllowedImage, 'Use o botão Carregar (ou uma imagem do Unsplash)'),
  alt: z.string().trim().min(1, 'Descreva a imagem (acessibilidade)').max(200),
})

// ─── Secções da landing page ───────────────────────────────────────────────

export const generalSchema = z.object({
  brandName: label,
  author: label,
  seoTitle: label,
  seoDescription: z.string().trim().min(20).max(300),
  keywords: z.array(text.min(1)).max(30),
  headerCta: label,
  whatsappUrl: url,
  footerText: text,
})

export const heroSchema = z.object({
  badge: text,
  titleStart: label,
  titleHighlight: label,
  subtitle: longText,
  ctaPrimary: label,
  ctaSecondary: label,
  stats: z.array(z.object({ value: label, label })).max(6),
})

export const aboutSchema = z.object({
  eyebrow: text,
  titleStart: label,
  titleHighlight: text,
  body: longText,
  linkLabel: text,
  personName: label,
  personRole: text,
  photo: imageSchema,
  skills: z.array(z.object({ label, icon })).max(8),
  footnote: text,
})

export const servicesSchema = z.object({
  eyebrow: text,
  titleStart: label,
  titleHighlight: text,
  items: z.array(z.object({ icon, title: label, text: longText })).max(12),
})

export const projectsIntroSchema = z.object({ eyebrow: text, title: label, subtitle: longText })

export const sectorsSchema = z.object({
  eyebrow: text,
  titleStart: label,
  titleHighlight: text,
  items: z.array(z.object({ title: label, text: longText })).min(1).max(8),
})

export const processSchema = z.object({
  eyebrow: text,
  titleStart: label,
  titleHighlight: text,
  steps: z.array(z.object({ title: label, text: longText })).min(1).max(8),
})

export const contactSectionSchema = z.object({
  eyebrow: text,
  title: label,
  text: longText,
  whatsappLabel: label,
  submitLabel: label,
})

export const socialPlatforms = ['linkedin', 'instagram', 'github', 'facebook', 'x', 'youtube', 'tiktok', 'whatsapp', 'email', 'website'] as const
export type SocialPlatform = (typeof socialPlatforms)[number]

export const socialsSchema = z.object({
  items: z
    .array(z.object({ platform: z.enum(socialPlatforms), label, url: url.refine((v) => v !== '', 'Obrigatório') }))
    .max(12),
})

export const solutionsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().trim().regex(/^[a-z0-9-]{2,60}$/, 'Só minúsculas, números e hífenes'),
        icon,
        title: label,
        description: longText,
        url,
        status: z.enum(['ativo', 'em-breve']),
      }),
    )
    .max(50),
})

export const contentSchemas = {
  general: generalSchema,
  hero: heroSchema,
  about: aboutSchema,
  services: servicesSchema,
  projectsIntro: projectsIntroSchema,
  sectors: sectorsSchema,
  process: processSchema,
  contact: contactSectionSchema,
  socials: socialsSchema,
  solutions: solutionsSchema,
} as const

export type ContentKey = keyof typeof contentSchemas
export const contentKeys = Object.keys(contentSchemas) as ContentKey[]

export type SiteContent = { [K in ContentKey]: z.infer<(typeof contentSchemas)[K]> }

// ─── Projetos ──────────────────────────────────────────────────────────────

const paragraphs = z.array(z.string().trim().min(1).max(1500)).max(10)

export const projectSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Só minúsculas, números e hífenes (ex.: minha-loja)')
    .max(80),
  published: z.boolean(),
  title: label,
  tag: label,
  summary: z.string().trim().min(10).max(300),
  cover: imageSchema,
  gallery: z.array(imageSchema).max(8),
  /** Endereço do projeto online (site do cliente). Vazio = sem link. */
  websiteUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === '' || /^https?:\/\//i.test(v), 'Use um link http(s)://')
    .default(''),
  client: text,
  duration: text,
  services: z.array(text.min(1)).max(10),
  stack: z.array(text.min(1)).max(15),
  /** Secção "Tecnologias" da página do case. Opcional: por omissão fica oculta (clientes não precisam de ver a stack técnica). */
  showStack: z.boolean().default(false),
  challenge: paragraphs,
  solution: paragraphs,
  features: z.array(text.min(1)).max(12),
  results: z.array(z.object({ metric: label, label })).max(6),
  roi: longText,
})

export type Project = z.infer<typeof projectSchema>
export type ProjectImage = z.infer<typeof imageSchema>
