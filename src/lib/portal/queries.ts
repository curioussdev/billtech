import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { PortalProject, PortalRequest, ProjectDocument, ProjectEvent, RequestAttachment, RequestMessage } from '@/types/portal'

// Todas as leituras usam a sessão do utilizador: a RLS garante que cada cliente só vê o que é seu
// e que as notas internas nunca chegam ao portal.

export async function getProjects(): Promise<PortalProject[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('client_projects').select('*').order('created_at', { ascending: false })
  return (data ?? []) as PortalProject[]
}

/**
 * `clientId` é opcional — defesa em profundidade por cima da RLS (que já restringe por si só). Omitir
 * mantém o comportamento de sempre; é usado assim pelo admin (`(admin)/admin/pedidos/[id]/page.tsx`),
 * que precisa de ver o projeto de qualquer cliente.
 */
export async function getProject(id: string, clientId?: string): Promise<PortalProject | null> {
  const supabase = await createClient()
  let query = supabase.from('client_projects').select('*').eq('id', id)
  if (clientId) query = query.eq('client_id', clientId)
  const { data } = await query.maybeSingle()
  return (data as PortalProject | null) ?? null
}

/** Histórico de atividade do projeto, mais recente primeiro. */
export async function getProjectEvents(projectId: string): Promise<ProjectEvent[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('client_project_events').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
  return (data ?? []) as ProjectEvent[]
}

export type ClientProjectEvent = ProjectEvent & { projectName: string }

/** Últimos eventos de TODOS os projetos do cliente — para o centro de notificações. */
export async function getRecentClientEvents(clientId: string, limit = 8): Promise<ClientProjectEvent[]> {
  const supabase = await createClient()
  const { data: projects } = await supabase.from('client_projects').select('id, name').eq('client_id', clientId)
  const projectIds = (projects ?? []).map((p) => p.id as string)
  if (projectIds.length === 0) return []
  const nameById = new Map((projects ?? []).map((p) => [p.id as string, p.name as string]))
  const { data: events } = await supabase.from('client_project_events').select('*').in('project_id', projectIds).order('created_at', { ascending: false }).limit(limit)
  return (events ?? []).map((e) => ({ ...(e as ProjectEvent), projectName: nameById.get((e as ProjectEvent).project_id) ?? '' }))
}

/** Documentos do projeto (contratos, acessos, entregáveis) — só o admin carrega, ver `actions/documents.ts`. */
export async function getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('project_documents').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
  return (data ?? []) as ProjectDocument[]
}

export async function getRequests(): Promise<PortalRequest[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('requests').select('*').order('last_message_at', { ascending: false })
  return (data ?? []) as PortalRequest[]
}

export async function getRequestWithMessages(id: string): Promise<{ request: PortalRequest; messages: RequestMessage[]; attachments: RequestAttachment[] } | null> {
  const supabase = await createClient()
  const { data: request } = await supabase.from('requests').select('*').eq('id', id).maybeSingle()
  if (!request) return null
  const [{ data: messages }, { data: attachments }] = await Promise.all([
    supabase.from('request_messages').select('*').eq('request_id', id).order('created_at', { ascending: true }),
    supabase.from('request_attachments').select('*').eq('request_id', id).order('created_at', { ascending: true }),
  ])
  return { request: request as PortalRequest, messages: (messages ?? []) as RequestMessage[], attachments: (attachments ?? []) as RequestAttachment[] }
}

export type InboxMessage = { read_at: string | null; broadcast: { id: string; subject: string; body: string; created_at: string } }

/** Comunicados enviados pela BillTech a este cliente — `clientId` é defesa em profundidade por cima da RLS (que já restringe por si só). */
export async function getInbox(clientId: string): Promise<InboxMessage[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('broadcast_recipients').select('read_at, broadcasts(id, subject, body, created_at)').eq('client_id', clientId)
  const rows = (data ?? []) as unknown as { read_at: string | null; broadcasts: InboxMessage['broadcast'] | null }[]
  return rows
    .filter((r) => r.broadcasts)
    .map((r) => ({ read_at: r.read_at, broadcast: r.broadcasts as InboxMessage['broadcast'] }))
    .sort((a, b) => b.broadcast.created_at.localeCompare(a.broadcast.created_at))
}

/** Contador de comunicados ainda não lidos — usado no dashboard (corrige o tile que antes contava pedidos não lidos) e pode substituir a mesma query repetida no layout do portal. */
export async function getUnreadMessagesCount(clientId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase.from('broadcast_recipients').select('broadcast_id', { count: 'exact', head: true }).eq('client_id', clientId).is('read_at', null)
  return count ?? 0
}
