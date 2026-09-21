import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ProjectCard } from '@/components/portal/project-widgets'
import { Button } from '@/components/ui/button'
import { getProjects } from '@/lib/portal/queries'

export const metadata: Metadata = { title: 'Projetos' }

export default async function PortalProjectsPage() {
  const projects = await getProjects()

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Os seus projetos</h1>
          <p className="mt-2 text-muted-foreground">Etapa atual, progresso e datas de cada projeto.</p>
        </div>
        <Button render={<Link href="/area-cliente/pedidos/novo?tipo=implementacao" />} nativeButton={false} variant="outline">
          <Plus aria-hidden /> Propor um novo projeto
        </Button>
      </header>

      {projects.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-muted-foreground">
          Ainda não há projetos na sua conta. Tem uma ideia? Use «Propor um novo projeto» e falamos.
        </p>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
