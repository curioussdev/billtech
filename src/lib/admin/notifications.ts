import 'server-only'
import { formatEUR } from '@/lib/admin/format'
import { createAdminClient } from '@/lib/supabase/server'

export type AdminNotificationItem = { id: string; label: string; href: string; hint?: string }

export interface AdminNotifications {
  unreadRequests: AdminNotificationItem[]
  pendingChangeRequests: AdminNotificationItem[]
  overdueInvoices: AdminNotificationItem[]
  upcomingMeetings: AdminNotificationItem[]
  recentWins: AdminNotificationItem[]
}

const clientLabel = (p: { full_name?: string | null; company?: string | null; email?: string | null } | null) => p?.company || p?.full_name || p?.email || 'Cliente'

/**
 * Agrega tudo o que precisa da atenção do admin — pedidos, alterações pendentes, faturas em
 * atraso, reuniões próximas e negócios fechados — num só sítio, para não ter de ir a 5 páginas
 * diferentes para saber o que mudou desde a última visita.
 */
export async function getAdminNotifications(): Promise<AdminNotifications> {
  const db = createAdminClient()
  const in7Days = new Date(Date.now() + 7 * 86_400_000).toISOString()
  const since7Days = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const now = new Date().toISOString()

  const [requestsRes, changesRes, invoicesRes, meetingsRes, winsRes] = await Promise.all([
    db.from('requests').select('id, title, client_id, profiles(full_name, company, email)').eq('admin_unread', true).order('last_message_at', { ascending: false }).limit(8),
    db.from('profile_change_requests').select('id, field, requested_value, client_id, profiles!client_id(full_name, company, email)').eq('status', 'pendente').order('created_at', { ascending: false }).limit(8),
    db.from('invoices').select('id, description, final_amount, client_id, profiles(full_name, company, email)').eq('status', 'atrasado').order('due_date', { ascending: true }).limit(8),
    db.from('meetings').select('id, title, start').gte('start', now).lte('start', in7Days).order('start', { ascending: true }).limit(8),
    db.from('leads').select('id, company, estimated_value').eq('stage', 'ganho').gte('stage_entered_at', since7Days).order('stage_entered_at', { ascending: false }).limit(8),
  ])

  type ProfileRef = { full_name: string | null; company: string | null; email: string | null } | null

  const unreadRequests: AdminNotificationItem[] = (requestsRes.data ?? []).map((r) => ({
    id: r.id,
    label: r.title,
    href: `/admin/pedidos/${r.id}`,
    hint: clientLabel(r.profiles as unknown as ProfileRef),
  }))

  const fieldLabels: Record<string, string> = { nif: 'NIF', email: 'email' }
  const pendingChangeRequests: AdminNotificationItem[] = (changesRes.data ?? []).map((c) => ({
    id: c.id,
    label: `Pedido de alteração de ${fieldLabels[c.field] ?? c.field} — ${clientLabel(c.profiles as unknown as ProfileRef)}`,
    href: `/admin/clientes/${c.client_id}`,
    hint: `Novo valor: ${c.requested_value}`,
  }))

  const overdueInvoices: AdminNotificationItem[] = (invoicesRes.data ?? []).map((i) => ({
    id: i.id,
    label: `${i.description} — ${clientLabel(i.profiles as unknown as ProfileRef)}`,
    href: `/admin/finance?cliente=${i.client_id}`,
    hint: formatEUR(i.final_amount),
  }))

  const upcomingMeetings: AdminNotificationItem[] = (meetingsRes.data ?? []).map((m) => ({
    id: m.id,
    label: m.title,
    href: '/admin/prospecting',
    hint: new Date(m.start).toLocaleString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
  }))

  const recentWins: AdminNotificationItem[] = (winsRes.data ?? []).map((l) => ({
    id: l.id,
    label: `Negócio ganho — ${l.company}`,
    href: `/admin/revenue/${l.id}`,
    hint: formatEUR(l.estimated_value),
  }))

  return { unreadRequests, pendingChangeRequests, overdueInvoices, upcomingMeetings, recentWins }
}
