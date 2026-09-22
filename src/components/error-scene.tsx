'use client'

import Link from 'next/link'
import { m } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Action = { label: string; href?: string; onClick?: () => void; icon?: React.ReactNode }

/**
 * Cena animada partilhada pelas páginas de erro/404 — um único sítio para a animação, reutilizado
 * em 3 contextos (site público, admin, área de cliente) para não repetir a coreografia 6 vezes.
 * Toda a animação usa `motion-safe:` nos utilitários Tailwind e `m`/framer-motion já respeita
 * `prefers-reduced-motion` (via `MotionConfig reducedMotion="user"` no `MotionProvider` global).
 */
export function ErrorScene({
  code,
  icon,
  title,
  description,
  primary,
  secondary,
  compact = false,
}: {
  code?: string
  icon: React.ReactNode
  title: string
  description: string
  primary: Action
  secondary?: Action
  /** Versão mais pequena, para caber dentro do admin/área de cliente (não ocupa o ecrã todo). */
  compact?: boolean
}) {
  return (
    <div className={cn('relative mx-auto grid place-items-center overflow-hidden px-5 text-center', compact ? 'min-h-[60vh] py-12' : 'min-h-screen py-24')}>
      {/* Formas decorativas a flutuar ao fundo — puramente visuais, escondidas de leitores de ecrã */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <m.div
          className="absolute left-1/2 top-1/2 size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl motion-safe:animate-pulse"
          style={{ animationDuration: '6s' }}
        />
        <m.span
          className="absolute left-[18%] top-[22%] size-3 rounded-full bg-primary/40"
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <m.span
          className="absolute right-[20%] top-[30%] size-2 rounded-full bg-accent/50"
          animate={{ y: [0, 14, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        />
        <m.span
          className="absolute bottom-[24%] left-[28%] size-2.5 rounded-full bg-primary/30"
          animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        />
        <m.span
          className="absolute bottom-[30%] right-[24%] size-1.5 rounded-full bg-accent/40"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
        />
      </div>

      <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }} className="grid max-w-md gap-6">
        <m.div
          className="mx-auto flex size-24 items-center justify-center rounded-[2rem] bg-primary/10 text-primary"
          animate={{ rotate: [0, -6, 6, -4, 4, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
        >
          <span className="[&_svg]:size-11">{icon}</span>
        </m.div>

        <div className="grid gap-2">
          {code && <p className="text-sm font-black uppercase tracking-[0.3em] text-primary">{code}</p>}
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {primary.href ? (
            <Button render={<Link href={primary.href} />} nativeButton={false} size="lg" className="h-11 rounded-full px-6">
              {primary.icon}
              {primary.label}
            </Button>
          ) : (
            <Button type="button" onClick={primary.onClick} size="lg" className="h-11 rounded-full px-6">
              {primary.icon}
              {primary.label}
            </Button>
          )}
          {secondary &&
            (secondary.href ? (
              <Button render={<Link href={secondary.href} />} nativeButton={false} variant="outline" size="lg" className="h-11 rounded-full px-6">
                {secondary.icon}
                {secondary.label}
              </Button>
            ) : (
              <Button type="button" onClick={secondary.onClick} variant="outline" size="lg" className="h-11 rounded-full px-6">
                {secondary.icon}
                {secondary.label}
              </Button>
            ))}
        </div>
      </m.div>
    </div>
  )
}
