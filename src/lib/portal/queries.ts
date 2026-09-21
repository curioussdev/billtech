import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { PortalProject, PortalRequest, RequestMessage } from '@/types/portal'

// Todas as leituras usam a sessão do utilizador: a RLS garante que cada cliente só vê o que é seu
// e que as notas internas nunca chegam ao portal.

export async function getProjects(): Promise<PortalProject[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('client_projects').select('*').order('created_at', { ascending: false })
  return (data ?? []) as PortalProject[]
}

export async function getProject(id: string): Promise<PortalProject | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('client_projects').select('*').eq('id', id).maybeSingle()
  return (data as PortalProject | null) ?? null
}

export async function getRequests(): Promise<PortalRequest[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('requests').select('*').order('last_message_at', { ascending: false })
  return (data ?? []) as PortalRequest[]
}

export async function getRequestWithMessages(id: string): Promise<{ request: PortalRequest; messages: RequestMessage[] } | null> {
  const supabase = await createClient()
  const { data: request } = await supabase.from('requests').select('*').eq('id', id).maybeSingle()
  if (!request) return null
  const { data: messages } = await supabase.from('request_messages').select('*').eq('request_id', id).order('created_at', { ascending: true })
  return { request: request as PortalRequest, messages: (messages ?? []) as RequestMessage[] }
}

export type InboxMessage = { read_at: string | null; broadcast: { id: string; subject: string; body: string; created_at: string } }

/** Comunicados enviados pela BillTech a este cliente (a RLS limita aos seus), do mais recente ao mais antigo. */
export async function getInbox(): Promise<InboxMessage[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('broadcast_recipients').select('read_at, broadcasts(id, subject, body, created_at)')
  const rows = (data ?? []) as unknown as { read_at: string | null; broadcasts: InboxMessage['broadcast'] | null }[]
  return rows
    .filter((r) => r.broadcasts)
    .map((r) => ({ read_at: r.read_at, broadcast: r.broadcasts as InboxMessage['broadcast'] }))
    .sort((a, b) => b.broadcast.created_at.localeCompare(a.broadcast.created_at))
}
