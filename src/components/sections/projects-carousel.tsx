import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { Badge } from '@/components/ui/badge'
import { AutoCarousel } from '@/components/sections/auto-carousel'
import type { Project, SiteContent } from '@/lib/content/schema'

function ProjectCard({ project, priority, index }: { project: Project; priority?: boolean; index: number }) {
  return (
    <Link
      href={`/projetos/${project.slug}`}
      className="float-card group relative block aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 shadow-xl shadow-black/30 outline-offset-4 transition-shadow duration-500 hover:shadow-2xl hover:shadow-black/50 focus-visible:outline-2 focus-visible:outline-inverse-brand"
      style={{ ["--float-delay" as string]: `${(index % 6) * -1.1}s` }}
    >
      <Image
        src={project.cover.src}
        alt={project.cover.alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <Badge className="mb-3 h-auto border-0 bg-accent px-2.5 py-1 text-accent-foreground">{project.tag}</Badge>
        <h3 className="text-2xl font-bold text-white">{project.title}</h3>
        <p className="mt-2 text-sm leading-6 text-white/85">{project.summary}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-inverse-brand">
          Ver Projeto <ArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden />
        </span>
      </div>
    </Link>
  )
}

export function ProjectsCarousel({ intro, projects }: { intro: SiteContent['projectsIntro']; projects: Project[] }) {
  return (
    <section id="projetos" className="bg-inverse px-5 py-24 text-inverse-foreground lg:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-inverse-brand">{intro.eyebrow}</p>
          <h2 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">{intro.title}</h2>
          <p className="mt-4 max-w-xl text-inverse-muted">{intro.subtitle}</p>
        </Reveal>

        <Reveal delay={0.1}>
          <AutoCarousel label="Projetos em destaque" slides={projects.map((project, index) => <ProjectCard key={project.slug} project={project} priority={index < 3} index={index} />)} />
        </Reveal>
      </div>
    </section>
  )
}
