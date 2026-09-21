'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const items = [
  { href: '/area-cliente', label: 'Visão geral', exact: true },
  { href: '/area-cliente/projetos', label: 'Projetos' },
  { href: '/area-cliente/pedidos', label: 'Pedidos' },
  { href: '/area-cliente/solucoes', label: 'Soluções' },
  { href: '/area-cliente/conta', label: 'A minha conta' },
]

export function PortalNav({ unread }: { unread: number }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Área de cliente" className="-mb-px flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
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
            {item.href.endsWith('/pedidos') && unread > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[0.65rem] font-bold leading-none text-primary-foreground">
                {unread}
                <span className="sr-only"> por ler</span>
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
