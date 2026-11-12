import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { ArrowLeft, ArrowUpRight, CalendarClock, Plus } from 'lucide-react'
import { DueBadge, ProjectStageBadge, RequestStatusBadge } from '@/components/portal/badges'
import { ContractCard } from '@/components/portal/contract-card'
import { DocumentsSection } from '@/components/portal/documents-section'
import { Reveal } from '@/components/motion/reveal'
import { ProgressBar, ProjectStepper, ProjectTimeline } from '@/components/portal/project-widgets'
import { Surface } from '@/components/portal/surface'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/auth'
import { formatDate, requestTypeLabels } from '@/lib/portal/labels'
import { dueSeverity } from '@/lib/portal/schedule'
import { getProject, getProjectDocuments, getProjectEvents, getRequests } from '@/lib/portal/queries'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Projeto' }

export default async function PortalProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()

  const profile = await requireUser()
  const [project, requests] = await Promise.all([getProject(id, profile.id), getRequests()])
  if (!project) notFound()
  const supabase = await createClient()
  const [events, documents, { data: contract }] = await Promise.all([getProjectEvents(project.id), getProjectDocuments(project.id), supabase.from('contracts').select('sent_at').eq('project_id', project.id).maybeSingle()])
  const related = requests.filter((r) => r.project_id === project.id)
  const severity = dueSeverity(project)

  return (
    <div className="grid gap-8">
      <Link href="/area-cliente/projetos" className="inline-flex w-fit items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Todos os projetos
      </Link>

      <header className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight">{project.name}</h1>
          <DueBadge severity={severity} />
          <ProjectStageBadge stage={project.status} />
        </div>
        {project.description && <p className="max-w-2xl text-muted-foreground">{project.description}</p>}
        <div className="flex flex-wrap gap-3">
          <Button render={<Link href={`/area-cliente/pedidos/novo?tipo=alteracao&projeto=${project.id}`} />} nativeButton={false} className="rounded-full">
            <Plus aria-hidden /> Pedir uma alteração
          </Button>
          <Button render={<Link href={`/area-cliente/pedidos/novo?tipo=implementacao&projeto=${project.id}`} />} nativeButton={false} variant="outline" className="rounded-full">
            Pedir nova funcionalidade
          </Button>
          {project.url && (
            <Button render={<a href={project.url} target="_blank" rel="noopener noreferrer" />} nativeButton={false} variant="outline" className="rounded-full">
              Abrir projeto <ArrowUpRight data-icon="inline-end" aria-hidden />
              <span className="sr-only"> (abre num novo separador)</span>
            </Button>
          )}
        </div>
      </header>

      <Surface as="section" aria-label="Estado do projeto" className="grid gap-6 p-6">
        <ProjectStepper stage={project.status} />
        <ProgressBar value={project.progress} label={`Progresso de ${project.name}`} />
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="size-4" aria-hidden />
          {project.due_date ? `Entrega prevista: ${formatDate(project.due_date)}` : 'Data de entrega ainda por definir'} · última atualização {formatDate(project.updated_at)}
        </p>
      </Surface>

      <ContractCard projectId={project.id} document={documents.find((d) => d.kind === 'contrato')} pendingSentAt={contract?.sent_at} />

      <section aria-labelledby="atividade-projeto">
        <h2 id="atividade-projeto" className="text-xl font-bold">
          Histórico de atividade
        </h2>
        <Surface className="mt-4 p-6">
          <ProjectTimeline events={events} />
        </Surface>
      </section>

      <section aria-labelledby="documentos-projeto">
        <h2 id="documentos-projeto" className="text-xl font-bold">
          Documentos
        </h2>
        <div className="mt-4">
          <DocumentsSection projectId={project.id} documents={documents} isAdmin={false} />
        </div>
      </section>

      <section aria-labelledby="pedidos-projeto">
        <h2 id="pedidos-projeto" className="text-xl font-bold">
          Pedidos deste projeto
        </h2>
        {related.length === 0 ? (
          <Surface tone="dashed" className="mt-4 p-6 text-sm text-muted-foreground">Nenhum pedido ligado a este projeto. Use os botões acima quando precisar de algo.</Surface>
        ) : (
          <Surface as="ul" className="mt-4 divide-y divide-border overflow-hidden">
            {related.map((r, i) => (
              <li key={r.id}>
                <Reveal delay={Math.min(i, 5) * 0.05} y={12}>
                  <Link href={`/area-cliente/pedidos/${r.id}`} className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-muted/60">
                    <span className="font-medium">{r.title}</span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {requestTypeLabels[r.type]} <RequestStatusBadge status={r.status} />
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </Surface>
        )}
      </section>
    </div>
  )
}
