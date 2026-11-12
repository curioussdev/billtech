import { Reveal } from '@/components/motion/reveal'
import { SectionHeading, SectionShell } from '@/components/marketing/section'
import { ProcessRail } from '@/components/marketing/process-rail'
import type { SiteContent } from '@/lib/content/schema'

export function Process({ content }: { content: SiteContent['process'] }) {
  const processSteps = content.steps.map((step, i) => ({ ...step, number: String(i + 1).padStart(2, '0') }))
  return (
    <SectionShell tone="band" ariaLabelledby="processo-titulo">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-14 max-w-2xl">
          <SectionHeading id="processo-titulo" eyebrow={content.eyebrow} titleStart={content.titleStart} titleHighlight={content.titleHighlight} />
        </Reveal>
        <ProcessRail steps={processSteps} />
      </div>
    </SectionShell>
  )
}
