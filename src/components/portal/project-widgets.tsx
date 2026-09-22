import Link from 'next/link'
import { ArrowRight, CalendarClock, Check, MessageSquareText, PencilLine, Receipt, TrendingUp } from 'lucide-react'
import { DueBadge, ProjectStageBadge } from '@/components/portal/badges'
import { formatDate, projectStageLabels } from '@/lib/portal/labels'
import { dueSeverity } from '@/lib/portal/schedule'
import { cn } from '@/lib/utils'
import { PROJECT_STAGES, type PortalProject, type ProjectEvent, type ProjectStage } from '@/types/portal'

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">Progresso</span>
        <span className="font-semibold tabular-nums">{value}%</span>
      </div>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

const STEPS = PROJECT_STAGES.filter((s) => s !== 'manutencao') as Exclude<ProjectStage, 'manutencao'>[]

/** Linha de etapas do projeto. "Manutenção" conta como tudo concluído. */
export function ProjectStepper({ stage }: { stage: ProjectStage }) {
  const current = stage === 'manutencao' ? STEPS.length : STEPS.indexOf(stage as Exclude<ProjectStage, 'manutencao'>)
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Etapas do projeto">
      {STEPS.map((step, i) => {
        const done = i < current || stage === 'entregue' || stage === 'manutencao'
        const active = i === current && stage !== 'entregue' && stage !== 'manutencao'
        return (
          <li key={step} aria-current={active ? 'step' : undefined} className="grid gap-2">
            <span className={cn('h-1.5 rounded-full', done ? 'bg-primary' : active ? 'bg-primary/50' : 'bg-muted')} />
            <span className={cn('flex items-center gap-1 text-xs', active ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
              {done && <Check className="size-3 text-primary" aria-hidden />}
              {projectStageLabels[step]}
              {done && <span className="sr-only"> (concluída)</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function ProjectCard({ project }: { project: PortalProject }) {
  const severity = dueSeverity(project)
  return (
    <Link href={`/area-cliente/projetos/${project.id}`} className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold leading-snug">{project.name}</h3>
        <span className="flex shrink-0 items-center gap-1.5">
          <DueBadge severity={severity} />
          <ProjectStageBadge stage={project.status} />
        </span>
      </div>
      {project.description && <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>}
      <div className="mt-auto grid gap-3">
        <ProgressBar value={project.progress} label={`Progresso de ${project.name}`} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-3.5" aria-hidden />
            {project.due_date ? `Entrega prevista: ${formatDate(project.due_date)}` : 'Sem data definida'}
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-primary">
            Ver detalhes <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  )
}

const eventIcon: Record<ProjectEvent['kind'], React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  status: TrendingUp,
  progress: TrendingUp,
  due_date: CalendarClock,
  nota: MessageSquareText,
  faturacao: Receipt,
}

/** Histórico de atividade do projeto — o "porquê" por trás da etapa atual, não só o estado presente. */
export function ProjectTimeline({ events }: { events: ProjectEvent[] }) {
  if (events.length === 0) {
    return <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Ainda sem atividade registada neste projeto.</p>
  }
  return (
    <ol className="grid gap-4 border-l border-border pl-5">
      {events.map((event) => {
        const Icon = eventIcon[event.kind] ?? PencilLine
        return (
          <li key={event.id} className="relative">
            <span className="absolute -left-[1.65rem] top-0.5 flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-background">
              <Icon className="size-3" aria-hidden />
            </span>
            <p className="text-sm leading-6">{event.message}</p>
            <time className="text-xs text-muted-foreground">{formatDate(event.created_at)}</time>
          </li>
        )
      })}
    </ol>
  )
}
