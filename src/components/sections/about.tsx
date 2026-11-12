import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { GlowOrb } from '@/components/marketing/glow-orb'
import { IconTile } from '@/components/marketing/icon-tile'
import { SectionHeading, SectionShell } from '@/components/marketing/section'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { SiteContent } from '@/lib/content/schema'
import { getIcon } from '@/lib/icons'

export function About({ content }: { content: SiteContent['about'] }) {
  return (
    <SectionShell id="sobre" tone="band">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_.9fr]">
        <Reveal>
          <SectionHeading eyebrow={content.eyebrow} titleStart={content.titleStart} titleHighlight={content.titleHighlight} className="max-w-xl" />
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">{content.body}</p>
          {content.linkLabel && (
            <Button render={<Link href="/#contato" />} nativeButton={false} variant="link" className="mt-5 h-auto px-0 text-base">
              {content.linkLabel} <ArrowRight data-icon="inline-end" aria-hidden />
            </Button>
          )}
        </Reveal>

        <Reveal delay={0.12}>
          <Card className="relative overflow-hidden rounded-3xl border-primary/15 bg-card shadow-xl">
            <GlowOrb tone="primary" className="-right-6 -top-6 h-32 w-32" />
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
                  {content.skills.map((skill) => (
                    <li key={skill.label} className="flex items-center gap-3 rounded-2xl bg-muted p-3 text-sm font-semibold">
                      <IconTile icon={getIcon(skill.icon)} size="sm" />
                      {skill.label}
                    </li>
                  ))}
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
    </SectionShell>
  )
}
