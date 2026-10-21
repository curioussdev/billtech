'use client'

import { AlertTriangle, Clock } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { priorityLabels, projectStageLabels, requestStatusLabels } from '@/lib/portal/labels'
import type { DueSeverity } from '@/lib/portal/schedule'
import type { ProjectStage, RequestPriority, RequestStatus } from '@/types/portal'

/** Explicação curta de cada etapa — só aparece ao passar o rato, não substitui o texto do badge. */
const stageHints: Record<ProjectStage, string> = {
  planeamento: 'Ainda a definir âmbito e requisitos, antes de começar a desenvolver.',
  desenvolvimento: 'A equipa está a construir as funcionalidades.',
  testes: 'Em validação antes de ir para produção.',
  entregue: 'Já está em produção e disponível para usar.',
  manutencao: 'Entregue, agora em acompanhamento e pequenos ajustes contínuos.',
}

const dueHints: Record<'atrasado' | 'esta_semana', string> = {
  atrasado: 'A data de entrega prevista já passou.',
  esta_semana: 'A data de entrega prevista é nos próximos 7 dias.',
}

const pill = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold'

const statusStyles: Record<RequestStatus, string> = {
  aberto: 'bg-sky-500/15 text-sky-800 dark:text-sky-300',
  em_analise: 'bg-violet-500/15 text-violet-800 dark:text-violet-300',
  em_curso: 'bg-amber-500/15 text-amber-900 dark:text-amber-300',
  aguarda_cliente: 'bg-orange-500/20 text-orange-900 dark:text-orange-300',
  concluido: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  cancelado: 'bg-muted text-muted-foreground',
}

export function RequestStatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  return <span className={cn(pill, statusStyles[status], className)}>{requestStatusLabels[status]}</span>
}

const priorityStyles: Record<RequestPriority, string> = {
  baixa: 'bg-muted text-muted-foreground',
  normal: 'bg-muted text-foreground',
  alta: 'bg-orange-500/15 text-orange-900 dark:text-orange-300',
  urgente: 'bg-red-500/15 text-red-800 dark:text-red-300',
}

export function PriorityBadge({ priority, className }: { priority: RequestPriority; className?: string }) {
  return <span className={cn(pill, priorityStyles[priority], className)}>Prioridade {priorityLabels[priority].toLowerCase()}</span>
}

const stageStyles: Record<ProjectStage, string> = {
  planeamento: 'bg-sky-500/15 text-sky-800 dark:text-sky-300',
  desenvolvimento: 'bg-amber-500/15 text-amber-900 dark:text-amber-300',
  testes: 'bg-violet-500/15 text-violet-800 dark:text-violet-300',
  entregue: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  manutencao: 'bg-teal-500/15 text-teal-800 dark:text-teal-300',
}

export function ProjectStageBadge({ stage, className }: { stage: ProjectStage; className?: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span className={cn(pill, stageStyles[stage], className, 'cursor-help')} />}>{projectStageLabels[stage]}</TooltipTrigger>
        <TooltipContent>{stageHints[stage]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/** Aviso de prazo — só aparece quando há mesmo algo a assinalar (atrasado ou esta semana). */
export function DueBadge({ severity, className }: { severity: DueSeverity; className?: string }) {
  if (!severity) return null
  const isLate = severity === 'atrasado'
  const Icon = isLate ? AlertTriangle : Clock
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={<span className={cn(pill, isLate ? 'bg-red-500/15 text-red-800 dark:text-red-300' : 'bg-amber-500/15 text-amber-900 dark:text-amber-300', className, 'cursor-help')} />}
        >
          <Icon className="size-3" aria-hidden />
          {isLate ? 'Atrasado' : 'Esta semana'}
        </TooltipTrigger>
        <TooltipContent>{dueHints[severity]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/** Ponto "novo" com texto para leitores de ecrã (não depende só da cor). */
export function UnreadDot({ label = 'Nova mensagem' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
      <span className="size-2 rounded-full bg-primary" aria-hidden />
      <span className="sr-only">{label}</span>
      <span aria-hidden>{label}</span>
    </span>
  )
}
