import { Reveal } from '@/components/motion/reveal'
import { SectionHeading, SectionShell } from '@/components/marketing/section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { SiteContent } from '@/lib/content/schema'

export function Sectors({ content }: { content: SiteContent['sectors'] }) {
  const sectors = content.items.map((item, i) => ({ ...item, value: `setor-${i}` }))
  return (
    <SectionShell id="setores" tone="base">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-12 max-w-2xl">
          <SectionHeading eyebrow={content.eyebrow} titleStart={content.titleStart} titleHighlight={content.titleHighlight} />
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

            {/* Efeito de "folha empilhada" (um segundo plano a espreitar) — distingue este painel do de Contact. */}
            <div className="relative">
              <div aria-hidden className="absolute -bottom-4 -right-4 hidden h-full w-full rounded-3xl bg-accent/20 lg:block" />
              <div className="relative flex min-h-64 items-center rounded-3xl bg-primary p-8 text-primary-foreground sm:p-14">
                {sectors.map((sector) => (
                  <TabsContent key={sector.value} value={sector.value} className="text-base">
                    <h3 className="text-3xl font-bold">{sector.title}</h3>
                    <p className="mt-5 max-w-lg text-lg leading-8">{sector.text}</p>
                  </TabsContent>
                ))}
              </div>
            </div>
          </Tabs>
        </Reveal>
      </div>
    </SectionShell>
  )
}
