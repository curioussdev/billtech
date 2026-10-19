import 'server-only'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createAdminClient } from '@/lib/supabase/server'

const isLive = () => isSupabaseConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

export type ExternalSiteStatus = 'ativo' | 'inativo'

export interface ExternalSite {
  id: string
  clientId: string
  clientName: string
  name: string
  domain: string
  status: ExternalSiteStatus
  lastPingAt: string | null
  createdAt: string
}

/**
 * Centro de Comando — Fase 1: registo dos sites externos dos clientes. A Fase 2 traz o endpoint de
 * ingestão e as métricas reais (page views, erros, uptime); por agora só o registo + chave de API.
 */
export async function listExternalSites(): Promise<ExternalSite[]> {
  if (!isLive()) return []
  try {
    const db = createAdminClient()
    const { data, error } = await db.from('external_sites').select('id, client_id, name, domain, status, last_ping_at, created_at').order('created_at', { ascending: false })
    if (error) throw error
    const rows = data ?? []
    const clientIds = [...new Set(rows.map((r) => r.client_id as string))]
    const { data: profiles } = await db.from('profiles').select('id, full_name, email, company').in('id', clientIds)
    const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p]))

    return rows.map((r) => {
      const profile = profileMap.get(r.client_id as string)
      return {
        id: r.id as string,
        clientId: r.client_id as string,
        clientName: (profile?.company as string) || (profile?.full_name as string) || (profile?.email as string) || 'Cliente',
        name: r.name as string,
        domain: r.domain as string,
        status: r.status as ExternalSiteStatus,
        lastPingAt: r.last_ping_at as string | null,
        createdAt: r.created_at as string,
      }
    })
  } catch (error) {
    console.error('[command-center] leitura de external_sites falhou:', error)
    return []
  }
}
