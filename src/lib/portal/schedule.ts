import type { PortalProject } from '@/types/portal'

export type DueSeverity = 'atrasado' | 'esta_semana' | null

const DAY_MS = 86_400_000

/** Lógica pura: se um projeto ainda não entregue está atrasado, ou vence esta semana. */
export function dueSeverity(project: Pick<PortalProject, 'due_date' | 'status'>, now: Date = new Date()): DueSeverity {
  if (!project.due_date || project.status === 'entregue' || project.status === 'manutencao') return null
  const due = new Date(project.due_date)
  const daysLeft = Math.ceil((due.getTime() - now.getTime()) / DAY_MS)
  if (daysLeft < 0) return 'atrasado'
  if (daysLeft <= 7) return 'esta_semana'
  return null
}
