import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Code2 } from 'lucide-react'
import { GlowOrb } from '@/components/marketing/glow-orb'
import { Reveal } from '@/components/motion/reveal'

/**
 * Shell partilhado de `/entrar` e `/auth/definir-password` — antes duplicado byte-a-byte nos dois
 * `page.tsx`. Acrescenta o `Reveal` (mesmo mecanismo usado em toda a landing page) e uma mancha de
 * fundo decorativa — as páginas de autenticação eram as únicas do site sem nenhuma animação/ligação
 * visual à marca.
 */
export function AuthShell({ title, subtitle, backLink = false, children }: { title: string; subtitle: string; backLink?: boolean; children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <GlowOrb tone="primary" className="pointer-events-none left-1/2 top-0 h-[420px] w-[640px] max-w-full -translate-x-1/2" />
      <div className="relative z-10 w-full max-w-md">
        {backLink && (
          <Link href="/" className="mb-8 inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden /> Voltar ao site
          </Link>
        )}
        <Reveal>
          <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Code2 aria-hidden />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight">{title}</h1>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            {children}
          </div>
        </Reveal>
      </div>
    </main>
  )
}
