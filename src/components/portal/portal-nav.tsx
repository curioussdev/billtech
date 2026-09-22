'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useClientPortalRealtime } from '@/hooks/use-realtime-portal'
import { cn } from '@/lib/utils'

const items = [
  { href: '/area-cliente', label: 'Visão geral', exact: true },
  { href: '/area-cliente/projetos', label: 'Projetos' },
  { href: '/area-cliente/pagamentos', label: 'Faturas' },
  { href: '/area-cliente/pedidos', label: 'Pedidos' },
  { href: '/area-cliente/mensagens', label: 'Mensagens' },
  { href: '/area-cliente/solucoes', label: 'Soluções' },
  { href: '/area-cliente/conta', label: 'A minha conta' },
]

export function PortalNav({ clientId, unread, unreadMessages, openInvoices }: { clientId: string; unread: number; unreadMessages: number; openInvoices: number }) {
  const pathname = usePathname()
  useClientPortalRealtime(clientId)

  const badgeFor = (href: string) => {
    if (href.endsWith('/pedidos')) return unread
    if (href.endsWith('/mensagens')) return unreadMessages
    if (href.endsWith('/pagamentos')) return openInvoices
    return 0
  }

  return (
    <nav aria-label="Área de cliente" className="-mb-px flex gap-1 overflow-x-auto print:hidden">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
        const badge = badgeFor(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors',
              active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
            {badge > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[0.65rem] font-bold leading-none text-primary-foreground">
                {badge}
                <span className="sr-only"> por ler</span>
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
