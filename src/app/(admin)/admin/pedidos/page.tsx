import type { Metadata } from 'next'
import Link from 'next/link'
import { PriorityBadge, RequestStatusBadge, UnreadDot } from '@/components/portal/badges'
import { formatDate, OPEN_STATUSES, requestTypeLabels } from '@/lib/portal/labels'
import { getRequests } from '@/lib/portal/queries'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Pedidos de clientes' }

const filters = [
  { key: 'abertos', label: 'Em aberto' },
  { key: 'por-ler', label: 'Por ler' },
  { key: 'concluidos', label: 'Concluídos' },
  { key: 'todos', label: 'Todos' },
] as const

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams
  const filter = filters.find((f) => f.key === ver)?.key ?? 'abertos'

  const all = await getRequests() // RLS de admin: vê todos
  const supabase = await createClient()
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, company')
  const clients = new Map((profiles ?? []).map((p) => [p.id as string, p]))

  const matchers = {
    abertos: (s: (typeof all)[number]) => OPEN_STATUSES.includes(s.status),
    'por-ler': (s: (typeof all)[number]) => s.admin_unread,
    concluidos: (s: (typeof all)[number]) => s.status === 'concluido' || s.status === 'cancelado',
    todos: () => true,
  }
  const rows = all.filter(matchers[filter])

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-black tracking-tight">Pedidos de clientes</h1>
      <p className="mb-6 mt-2 text-muted-foreground">Alterações, implementações e suporte pedidos pelos clientes na área de cliente.</p>

      <nav aria-label="Filtrar pedidos" className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link key={f.key} href={`/admin/pedidos?ver=${f.key}`} aria-current={filter === f.key ? 'page' : undefined} className={cn('rounded-full border px-4 py-1.5 text-sm font-medium', filter === f.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary')}>
            {f.label} <span className="tabular-nums opacity-80">({all.filter(matchers[f.key]).length})</span>
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-muted-foreground">Sem pedidos nesta vista.</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {rows.map((r) => {
            const client = clients.get(r.client_id)
            return (
              <li key={r.id}>
                <Link href={`/admin/pedidos/${r.id}`} className="grid gap-2 p-5 transition-colors hover:bg-muted/60">
                  <span className="flex flex-wrap items-start justify-between gap-2">
                    <span className="font-semibold leading-snug">{r.title}</span>
                    {r.admin_unread && <UnreadDot label="Por ler" />}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {client?.full_name || client?.email}
                    {client?.company ? ` · ${client.company}` : ''}
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <RequestStatusBadge status={r.status} />
                    <PriorityBadge priority={r.priority} />
                    <span>{requestTypeLabels[r.type]}</span>
                    <span aria-hidden>·</span>
                    <span>Atualizado a {formatDate(r.last_message_at)}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
