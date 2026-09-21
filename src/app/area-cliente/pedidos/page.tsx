import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PriorityBadge, RequestStatusBadge, UnreadDot } from '@/components/portal/badges'
import { Button } from '@/components/ui/button'
import { formatDate, OPEN_STATUSES, requestTypeLabels } from '@/lib/portal/labels'
import { getRequests } from '@/lib/portal/queries'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Pedidos' }

export default async function PortalRequestsPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams
  const all = await getRequests()
  const showAll = ver === 'todos'
  const requests = showAll ? all : all.filter((r) => OPEN_STATUSES.includes(r.status))

  const tabs = [
    { href: '/area-cliente/pedidos', label: 'Em aberto', active: !showAll, count: all.filter((r) => OPEN_STATUSES.includes(r.status)).length },
    { href: '/area-cliente/pedidos?ver=todos', label: 'Todos', active: showAll, count: all.length },
  ]

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Pedidos</h1>
          <p className="mt-2 text-muted-foreground">Alterações, novas funcionalidades, suporte e dúvidas — tudo num só sítio, com histórico.</p>
        </div>
        <Button render={<Link href="/area-cliente/pedidos/novo" />} nativeButton={false} className="rounded-full">
          <Plus aria-hidden /> Novo pedido
        </Button>
      </header>

      <nav aria-label="Filtrar pedidos" className="flex gap-2">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} aria-current={tab.active ? 'page' : undefined} className={cn('rounded-full border px-4 py-1.5 text-sm font-medium', tab.active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary')}>
            {tab.label} <span className="tabular-nums opacity-80">({tab.count})</span>
          </Link>
        ))}
      </nav>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-semibold">{showAll ? 'Ainda não fez nenhum pedido.' : 'Não tem pedidos em aberto.'}</p>
          <p className="mt-1 text-sm text-muted-foreground">Precisa de uma alteração ou de uma ideia nova? Estamos cá para ajudar.</p>
          <Button render={<Link href="/area-cliente/pedidos/novo" />} nativeButton={false} className="mt-5 rounded-full">
            Fazer um pedido
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {requests.map((r) => (
            <li key={r.id}>
              <Link href={`/area-cliente/pedidos/${r.id}`} className="grid gap-2 p-5 transition-colors hover:bg-muted/60">
                <span className="flex flex-wrap items-start justify-between gap-2">
                  <span className="font-semibold leading-snug">{r.title}</span>
                  {r.client_unread && <UnreadDot label="Nova resposta" />}
                </span>
                <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <RequestStatusBadge status={r.status} />
                  {(r.priority === 'alta' || r.priority === 'urgente') && <PriorityBadge priority={r.priority} />}
                  <span>{requestTypeLabels[r.type]}</span>
                  <span aria-hidden>·</span>
                  <span>Atualizado a {formatDate(r.last_message_at)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
