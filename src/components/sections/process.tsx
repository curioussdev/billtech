import { Reveal } from '@/components/motion/reveal'
import type { SiteContent } from '@/lib/content/schema'

export function Process({ content }: { content: SiteContent['process'] }) {
  const processSteps = content.steps.map((step, i) => ({ ...step, number: String(i + 1).padStart(2, '0') }))
  return (
    <section aria-labelledby="processo-titulo" className="border-y border-border bg-muted/40 px-5 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-14 max-w-2xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-primary">{content.eyebrow}</p>
          <h2 id="processo-titulo" className="text-4xl font-black tracking-tight sm:text-5xl">
            {content.titleStart} <span className="text-primary">{content.titleHighlight}</span>
          </h2>
        </Reveal>
        <ol className="grid gap-8 md:grid-cols-4">
          {processSteps.map((step, index) => (
            <li key={step.number} className="relative">
              <Reveal delay={index * 0.1}>
                <span aria-hidden className="text-5xl font-black text-primary/30">
                  {step.number}
                </span>
                <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.text}</p>
              </Reveal>
              {index < processSteps.length - 1 && <div aria-hidden className="absolute right-0 top-8 hidden w-1/3 border-t border-dashed border-primary/40 md:block" />}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
