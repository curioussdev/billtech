import { cn } from '@/lib/utils'

const toneClass = { primary: 'bg-primary/10', accent: 'bg-accent/15' } as const

/** Mancha decorativa desfocada — um só sítio para o idioma hoje repetido com classes soltas em Hero/About. */
export function GlowOrb({ tone = 'primary', className }: { tone?: keyof typeof toneClass; className?: string }) {
  return <div aria-hidden className={cn('pointer-events-none absolute rounded-full blur-3xl', toneClass[tone], className)} />
}
