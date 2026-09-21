import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { ContactForm } from '@/components/sections/contact-form'
import type { SiteContent } from '@/lib/content/schema'

export function Contact({ content, whatsappUrl }: { content: SiteContent['contact']; whatsappUrl: string }) {
  return (
    <section id="contato" className="px-5 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 rounded-[2rem] bg-primary p-7 text-primary-foreground sm:p-12 lg:grid-cols-[.85fr_1.15fr] lg:p-16">
        <Reveal>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em]">{content.eyebrow}</p>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">{content.title}</h2>
          <p className="mt-6 text-lg leading-8">{content.text}</p>
          {whatsappUrl && (
            <Button
              render={<Link href={whatsappUrl} target="_blank" rel="noopener noreferrer" />}
              nativeButton={false}
              size="lg"
              className="mt-8 h-12 rounded-full bg-accent px-6 text-base text-accent-foreground hover:bg-accent/90"
            >
              <MessageCircle data-icon="inline-start" aria-hidden />
              {content.whatsappLabel}
              <span className="sr-only"> (abre num novo separador)</span>
            </Button>
          )}
        </Reveal>
        <Reveal delay={0.12}>
          <ContactForm submitLabel={content.submitLabel} />
        </Reveal>
      </div>
    </section>
  )
}
