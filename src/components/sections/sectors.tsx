import { Reveal } from '@/components/motion/reveal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { SiteContent } from '@/lib/content/schema'

export function Sectors({ content }: { content: SiteContent['sectors'] }) {
  const sectors = content.items.map((item, i) => ({ ...item, value: `setor-${i}` }))
  return (
    <section id="setores" className="px-5 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-12 max-w-2xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-primary">{content.eyebrow}</p>
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
            {content.titleStart} <span className="text-primary">{content.titleHighlight}</span>
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <Tabs defaultValue={sectors[0].value} orientation="vertical" className="grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-10">
            <TabsList aria-label="Setores de atuação" className="h-auto w-full flex-col items-stretch justify-start gap-2 bg-transparent p-0">
              {sectors.map((sector) => (
                <TabsTrigger
                  key={sector.value}
                  value={sector.value}
                  className="h-auto flex-none justify-start rounded-xl border-border bg-muted px-5 py-4 text-left text-base transition-colors hover:border-primary/40 data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground"
                >
                  {sector.title}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex min-h-64 items-center rounded-3xl bg-primary p-8 text-primary-foreground sm:p-14">
              {sectors.map((sector) => (
                <TabsContent key={sector.value} value={sector.value} className="text-base">
                  <h3 className="text-3xl font-bold">{sector.title}</h3>
                  <p className="mt-5 max-w-lg text-lg leading-8">{sector.text}</p>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </Reveal>
      </div>
    </section>
  )
}
