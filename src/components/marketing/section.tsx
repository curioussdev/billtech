import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type HeadingTone = 'brand' | 'inverse' | 'on-primary'

const eyebrowTone: Record<HeadingTone, string> = {
  brand: 'text-primary',
  inverse: 'text-inverse-brand',
  'on-primary': 'text-primary-foreground/75',
}

const highlightTone: Record<HeadingTone, string> = {
  brand: 'text-primary',
  inverse: 'text-inverse-brand',
  'on-primary': 'text-accent',
}

/**
 * Cabeçalho de secção (eyebrow + título). Substitui o bloco JSX que estava colado à mão em About,
 * Services, Sectors, Process e ProjectsCarousel — mas aceita `title` (sem destaque, usado pelo intro
 * dos Projetos) OU `titleStart`/`titleHighlight` (com a palavra destacada), porque os dados do CMS já
 * têm essas duas formas (ver `src/lib/content/schema.ts`).
 */
export function SectionHeading({
  eyebrow,
  title,
  titleStart,
  titleHighlight,
  tone = 'brand',
  id,
  className,
  titleClassName,
}: {
  eyebrow?: string
  title?: string
  titleStart?: string
  titleHighlight?: string
  tone?: HeadingTone
  id?: string
  className?: string
  titleClassName?: string
}) {
  return (
    <div className={className}>
      {eyebrow && <p className={cn('mb-4 text-sm font-bold uppercase tracking-[0.18em]', eyebrowTone[tone])}>{eyebrow}</p>}
      <h2 id={id} className={cn('text-4xl font-black tracking-tight sm:text-5xl', titleClassName)}>
        {title ?? (
          <>
            {titleStart} <span className={highlightTone[tone]}>{titleHighlight}</span>
          </>
        )}
      </h2>
    </div>
  )
}

type ShellTone = 'base' | 'band' | 'inverse'

const shellTone: Record<ShellTone, string> = {
  base: '',
  band: 'border-y border-border bg-muted/40',
  inverse: 'bg-inverse text-inverse-foreground',
}

/**
 * Wrapper de secção com a mesma caixa de espaçamento de sempre (`px-5 py-24 lg:px-8 lg:py-32`), mas
 * com o fundo escolhido por `tone` em vez de cada secção repetir `border-y border-border bg-muted/40`
 * ou `bg-inverse ...` à mão.
 */
export function SectionShell({
  tone = 'base',
  id,
  ariaLabelledby,
  ariaLabel,
  className,
  children,
}: {
  tone?: ShellTone
  id?: string
  ariaLabelledby?: string
  ariaLabel?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={ariaLabelledby} aria-label={ariaLabel} className={cn('px-5 py-24 lg:px-8 lg:py-32', shellTone[tone], className)}>
      {children}
    </section>
  )
}
