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

export async function getExternalSite(id: string): Promise<ExternalSite | null> {
  const sites = await listExternalSites()
  return sites.find((s) => s.id === id) ?? null
}

export interface TelemetryErrorEntry {
  id: string
  occurredAt: string
  message: string
}

export interface TelemetryDayPoint {
  date: string
  pageViews: number
  errors: number
}

export interface TelemetrySummary {
  days: TelemetryDayPoint[]
  totalPageViews: number
  totalErrors: number
  recentErrors: TelemetryErrorEntry[]
}

const EMPTY_SUMMARY: TelemetrySummary = { days: [], totalPageViews: 0, totalErrors: 0, recentErrors: [] }

/** Resumo de telemetria dos últimos `windowDays` dias de um site externo (visitas, erros, uptime). */
export async function getTelemetrySummary(externalSiteId: string, windowDays = 30): Promise<TelemetrySummary> {
  if (!isLive()) return EMPTY_SUMMARY
  try {
    const db = createAdminClient()
    const since = new Date(Date.now() - windowDays * 86_400_000).toISOString()
    const { data, error } = await db
      .from('telemetry_logs')
      .select('id, metric_type, value, occurred_at')
      .eq('external_site_id', externalSiteId)
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: false })
    if (error) throw error
    const rows = data ?? []

    const byDay = new Map<string, { pageViews: number; errors: number }>()
    for (let i = 0; i < windowDays; i++) {
      const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
      byDay.set(day, { pageViews: 0, errors: 0 })
    }

    const recentErrors: TelemetryErrorEntry[] = []
    let totalPageViews = 0
    let totalErrors = 0

    for (const r of rows) {
      const day = (r.occurred_at as string).slice(0, 10)
      const bucket = byDay.get(day)
      if (r.metric_type === 'page_view') {
        totalPageViews += 1
        if (bucket) bucket.pageViews += 1
      } else if (r.metric_type === 'error') {
        totalErrors += 1
        if (bucket) bucket.errors += 1
        if (recentErrors.length < 10) {
          const value = r.value as Record<string, unknown> | null
          recentErrors.push({ id: r.id as string, occurredAt: r.occurred_at as string, message: (value?.message as string) || 'Erro sem mensagem' })
        }
      }
    }

    const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }))
    return { days, totalPageViews, totalErrors, recentErrors }
  } catch (error) {
    console.error('[command-center] leitura de telemetry_logs falhou:', error)
    return EMPTY_SUMMARY
  }
}
