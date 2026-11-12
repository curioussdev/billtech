import { Reveal } from '@/components/motion/reveal'

export type ProcessRailStep = { number: string; title: string; text: string }

/**
 * Substitui o numeral gigante "fantasma" + linhas tracejadas por item: uma única linha (desktop)
 * atravessa a grelha, com marcadores circulares numerados sobre ela. Em mobile, a linha fica vertical
 * e os marcadores alinham-se à esquerda do texto. Mesmo `Reveal`/mesma ordem de conteúdo de sempre.
 */
export function ProcessRail({ steps }: { steps: ProcessRailStep[] }) {
  return (
    <ol className="relative grid gap-10 md:grid-cols-4 md:gap-8">
      <div aria-hidden className="absolute left-5 top-0 bottom-0 w-px bg-border md:left-0 md:right-0 md:top-5 md:bottom-auto md:h-px md:w-auto" />
      {steps.map((step, index) => (
        <li key={step.number} className="relative pl-14 md:pl-0">
          <Reveal delay={index * 0.1}>
            <span
              aria-hidden
              className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground md:relative md:left-auto md:top-auto md:mb-5"
            >
              {step.number}
            </span>
            <h3 className="text-xl font-bold">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.text}</p>
          </Reveal>
        </li>
      ))}
    </ol>
  )
}
