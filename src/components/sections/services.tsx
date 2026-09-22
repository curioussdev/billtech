import { Reveal } from '@/components/motion/reveal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SiteContent } from '@/lib/content/schema'
import { getIcon } from '@/lib/icons'

export function Services({ content }: { content: SiteContent['services'] }) {
  return (
    <section id="solucoes" className="px-5 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-primary">{content.eyebrow}</p>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
            {content.titleStart} <span className="text-primary">{content.titleHighlight}</span>
          </h2>
        </Reveal>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {content.items.map((item, index) => {
            const Icon = getIcon(item.icon)
            return (
              <li key={`${item.title}-${index}`}>
                <Reveal delay={(index % 4) * 0.08} className="h-full">
                  <Card className="group h-full rounded-3xl bg-card ring-1 ring-border/70 transition-all duration-300 hover:shadow-xl hover:ring-primary/50 motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.02]">
                    <CardHeader>
                      <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon aria-hidden />
                      </div>
                      <CardTitle className="text-xl leading-tight">
                        <h3>{item.title}</h3>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-6 text-muted-foreground">{item.text}</p>
                    </CardContent>
                  </Card>
                </Reveal>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
