import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { SiteContent } from '@/lib/content/schema'
import { getIcon } from '@/lib/icons'

export function About({ content }: { content: SiteContent['about'] }) {
  return (
    <section id="sobre" className="border-y border-border bg-muted/40 px-5 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_.9fr]">
        <Reveal>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-primary">{content.eyebrow}</p>
          <h2 className="max-w-xl text-4xl font-black tracking-tight sm:text-5xl">
            {content.titleStart} <span className="text-primary">{content.titleHighlight}</span>
          </h2>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">{content.body}</p>
          {content.linkLabel && (
            <Button render={<Link href="/#contato" />} nativeButton={false} variant="link" className="mt-5 h-auto px-0 text-base">
              {content.linkLabel} <ArrowRight data-icon="inline-end" aria-hidden />
            </Button>
          )}
        </Reveal>

        <Reveal delay={0.12}>
          <Card className="relative overflow-hidden rounded-3xl border-primary/15 bg-card shadow-xl">
            <div aria-hidden className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
            <CardContent className="relative p-8">
              <div className="flex items-center gap-5">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-full ring-4 ring-primary/10">
                  <Image src={content.photo.src} alt={content.photo.alt} fill sizes="80px" className="object-cover" />
                </div>
                <div>
                  <p className="text-xl font-bold">{content.personName}</p>
                  <p className="text-sm text-muted-foreground">{content.personRole}</p>
                </div>
              </div>
              {content.skills.length > 0 && (
                <ul className="mt-9 grid grid-cols-2 gap-3">
                  {content.skills.map((skill) => {
                    const Icon = getIcon(skill.icon)
                    return (
                      <li key={skill.label} className="flex items-center gap-3 rounded-2xl bg-muted p-4 text-sm font-semibold">
                        <Icon className="text-primary" aria-hidden />
                        {skill.label}
                      </li>
                    )
                  })}
                </ul>
              )}
              {content.footnote && (
                <p className="mt-7 flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="text-primary" aria-hidden /> {content.footnote}
                </p>
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </section>
  )
}
