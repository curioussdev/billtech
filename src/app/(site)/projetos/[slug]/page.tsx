import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Globe2, TrendingUp } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getProject, getProjects } from '@/lib/content/get'

type Props = { params: Promise<{ slug: string }> }

// Projetos novos criados na dashboard são gerados a pedido; slugs inexistentes devolvem 404
export const revalidate = 300

export async function generateStaticParams() {
  return (await getProjects()).map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) return {}

  const title = `${project.title} — Case de Sucesso (${project.tag})`
  return {
    title,
    description: project.summary,
    alternates: { canonical: `/projetos/${project.slug}` },
    openGraph: {
      type: 'article',
      title,
      description: project.summary,
      url: `/projetos/${project.slug}`,
      images: [{ url: project.cover.src, alt: project.cover.alt }],
    },
    twitter: { card: 'summary_large_image', title, description: project.summary, images: [project.cover.src] },
  }
}

const sectionTitle = 'text-3xl font-black tracking-tight sm:text-4xl'

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) notFound()

  const projects = await getProjects()
  const index = projects.findIndex((p) => p.slug === slug)
  const next = projects[(index + 1) % projects.length]

  return (
    <article className="px-5 pb-24 pt-32 lg:px-8 lg:pt-40">
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Navegação estrutural" className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="rounded-sm hover:text-foreground">
                Início
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/#projetos" className="rounded-sm hover:text-foreground">
                Projetos
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="font-medium text-foreground">
              {project.title}
            </li>
          </ol>
        </nav>

        <Reveal y={16}>
          <header className="mt-8">
            <Badge className="h-auto bg-accent px-3 py-1 text-accent-foreground">{project.tag}</Badge>
            <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight sm:text-6xl">{project.title}</h1>
            <p className="mt-5 max-w-2xl text-xl leading-8 text-muted-foreground">{project.summary}</p>

            <dl className="mt-10 grid gap-6 border-y border-border py-6 sm:grid-cols-3">
              {project.client && (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cliente</dt>
                  <dd className="mt-1 font-semibold">{project.client}</dd>
                </div>
              )}
              {project.duration && (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Duração</dt>
                  <dd className="mt-1 font-semibold">{project.duration}</dd>
                </div>
              )}
              {project.services.length > 0 && (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Serviços</dt>
                  <dd className="mt-1 font-semibold">{project.services.join(' · ')}</dd>
                </div>
              )}
            </dl>
          </header>
        </Reveal>

        <Reveal className="mt-10">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-muted">
            <Image src={project.cover.src} alt={project.cover.alt} fill priority sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
          </div>
        </Reveal>

        {project.websiteUrl && (
          <Reveal className="mt-8">
            <aside aria-labelledby="projeto-online" className="flex flex-col gap-4 rounded-3xl border border-primary/30 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Globe2 aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 id="projeto-online" className="text-xl font-black">
                    Veja este projeto online
                  </h2>
                  <p className="mt-1 text-muted-foreground">Explore o resultado final, tal como os clientes de {project.title} o veem.</p>
                  <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block max-w-full truncate rounded-sm font-semibold text-primary underline-offset-4 hover:underline">
                    {project.websiteUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
                    <span className="sr-only"> (abre num novo separador)</span>
                  </a>
                </div>
              </div>
              <Button render={<a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" />} nativeButton={false} size="lg" className="h-12 shrink-0 rounded-full px-7 text-base">
                Visitar o site <ArrowUpRight data-icon="inline-end" aria-hidden />
                <span className="sr-only"> (abre num novo separador)</span>
              </Button>
            </aside>
          </Reveal>
        )}

        <div className="mt-20 grid gap-16">
          <Reveal>
            <section aria-labelledby="desafio">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-primary">01</p>
              <h2 id="desafio" className={sectionTitle}>
                O Desafio
              </h2>
              <div className="mt-6 grid max-w-3xl gap-4 text-lg leading-8 text-muted-foreground">
                {project.challenge.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section aria-labelledby="solucao">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-primary">02</p>
              <h2 id="solucao" className={sectionTitle}>
                A Solução
              </h2>
              <div className="mt-6 grid max-w-3xl gap-4 text-lg leading-8 text-muted-foreground">
                {project.solution.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-8 grid gap-8 md:grid-cols-[1.4fr_1fr]">
                {project.features.length > 0 && (
                <ul className="grid gap-3">
                  {project.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 shrink-0 text-primary" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
                )}
                {project.stack.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Tecnologias</h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {project.stack.map((tech) => (
                      <li key={tech}>
                        <Badge variant="outline" className="h-auto px-3 py-1.5 text-sm">
                          {tech}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
                )}
              </div>
            </section>
          </Reveal>

          {project.gallery.length > 0 && (
          <section aria-labelledby="galeria">
            <h2 id="galeria" className="sr-only">
              Galeria do projeto
            </h2>
            <ul className="grid gap-4 sm:grid-cols-3">
              {project.gallery.map((image, i) => (
                <li key={image.src}>
                  <Reveal delay={i * 0.08}>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
                      <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 330px, (min-width: 640px) 33vw, 100vw" className="object-cover" />
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>
          )}

          {(project.results.length > 0 || project.roi) && (
          <Reveal>
            <section aria-labelledby="resultados" className="rounded-3xl bg-primary p-8 text-primary-foreground sm:p-12">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em]">03</p>
              <h2 id="resultados" className={sectionTitle}>
                Resultados &amp; ROI
              </h2>
              {project.results.length > 0 && (
              <ul className="mt-8 grid gap-6 sm:grid-cols-3">
                {project.results.map((result) => (
                  <li key={result.label} className="rounded-2xl bg-background/15 p-6">
                    <strong className="block text-4xl font-black">{result.metric}</strong>
                    <span className="mt-2 block text-sm leading-6">{result.label}</span>
                  </li>
                ))}
              </ul>
              )}
              {project.roi && (
              <p className="mt-8 flex max-w-3xl items-start gap-3 text-lg leading-8">
                <TrendingUp className="mt-1.5 shrink-0" aria-hidden />
                {project.roi}
              </p>
              )}
            </section>
          </Reveal>
          )}
        </div>

        <Reveal>
          <aside className="mt-20 flex flex-col items-start justify-between gap-6 border-t border-border pt-10 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-black">Quer resultados como estes?</h2>
              <p className="mt-2 text-muted-foreground">Peça um diagnóstico digital gratuito para o seu negócio.</p>
            </div>
            <Button render={<Link href="/#contato" />} nativeButton={false} size="lg" className="h-12 rounded-full bg-accent px-7 text-base text-accent-foreground hover:bg-accent/90">
              Falar com a BillTech <ArrowRight data-icon="inline-end" aria-hidden />
            </Button>
          </aside>
        </Reveal>

        <nav aria-label="Outros projetos" className="mt-10 flex flex-wrap items-center justify-between gap-4 text-sm font-semibold">
          <Link href="/#projetos" className="inline-flex items-center gap-2 rounded-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden /> Todos os projetos
          </Link>
          {next.slug !== project.slug && (
            <Link href={`/projetos/${next.slug}`} className="inline-flex items-center gap-2 rounded-sm text-primary hover:underline">
              Próximo: {next.title} <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </nav>
      </div>
    </article>
  )
}
