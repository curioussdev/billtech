import { Reveal } from '@/components/motion/reveal'
import { marketingCardHover } from '@/components/marketing/card-shell'
import { IconTile } from '@/components/marketing/icon-tile'
import { SectionHeading, SectionShell } from '@/components/marketing/section'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SiteContent } from '@/lib/content/schema'
import { getIcon } from '@/lib/icons'

export function Services({ content }: { content: SiteContent['services'] }) {
  return (
    <SectionShell id="solucoes" tone="base">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionHeading eyebrow={content.eyebrow} titleStart={content.titleStart} titleHighlight={content.titleHighlight} className="max-w-2xl" />
        </Reveal>
        {/* Desalinhamento leve nas colunas pares — quebra a simetria perfeita da grelha 4-up. */}
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:[&>*:nth-child(even)]:mt-6">
          {content.items.map((item, index) => {
            const Icon = getIcon(item.icon)
            return (
              <li key={`${item.title}-${index}`}>
                <Reveal delay={(index % 4) * 0.08} className="h-full">
                  <Card className={`group h-full rounded-3xl bg-card ${marketingCardHover}`}>
                    <CardHeader>
                      <IconTile icon={Icon} size="md" className="mb-5 transition-colors group-hover:bg-primary group-hover:text-primary-foreground" />
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
    </SectionShell>
  )
}
