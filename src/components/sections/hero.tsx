import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { SiteContent } from '@/lib/content/schema'

export function Hero({ content }: { content: SiteContent['hero'] }) {
  return (
    <section id="inicio" className="relative px-5 pb-20 pt-36 lg:px-8 lg:pb-28 lg:pt-48">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] max-w-full -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {content.badge && (
          <Reveal y={16}>
            <Badge variant="outline" className="h-auto rounded-full border-primary/40 bg-primary/5 px-4 py-2 text-primary">
              {content.badge}
            </Badge>
          </Reveal>
        )}
        <Reveal delay={0.08}>
          <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-black leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-8xl">
            {content.titleStart} <span className="text-primary">{content.titleHighlight}</span>
          </h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">{content.subtitle}</p>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button render={<Link href="/#contato" />} nativeButton={false} size="lg" className="h-12 rounded-full bg-accent px-7 text-base text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90">
              {content.ctaPrimary} <ArrowRight data-icon="inline-end" aria-hidden />
            </Button>
            <Button render={<Link href="/#projetos" />} nativeButton={false} size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">
              {content.ctaSecondary} <ChevronRight data-icon="inline-end" aria-hidden />
            </Button>
          </div>
        </Reveal>
        {content.stats.length > 0 && (
          <Reveal delay={0.32}>
            <ul className="mx-auto mt-20 grid max-w-3xl grid-cols-1 divide-y divide-border border-y border-border py-5 sm:auto-cols-fr sm:grid-flow-col sm:divide-x sm:divide-y-0">
              {content.stats.map((stat) => (
                <li key={stat.label} className="px-5 py-3 text-center">
                  <strong className="block text-2xl font-black">{stat.value}</strong>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>
    </section>
  )
}
