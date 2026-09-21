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
