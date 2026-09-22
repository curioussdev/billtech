import Link from 'next/link'
import { cn } from '@/lib/utils'

const tabs = [
  { key: 'recebidas', label: 'Recebidas', href: '/admin/mensagens' },
  { key: 'enviadas', label: 'Enviadas', href: '/admin/comunicacoes' },
] as const

/**
 * "Mensagens" e "Enviar mensagens" eram dois itens separados no menu, mas são duas direções da
 * mesma coisa (o que os clientes escrevem / o que a equipa envia) — passaram a ser abas de uma só
 * entrada no menu. Mantive as duas rotas como estavam (dados, permissões e sub-páginas diferentes:
 * "Enviadas" continua reservada a Super Admins), só a navegação entre elas ficou num só lugar.
 */
export function MessagesTabs({ active }: { active: 'recebidas' | 'enviadas' }) {
  return (
    <nav aria-label="Mensagens" className="mb-8 flex gap-1 border-b border-border">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? 'page' : undefined}
          className={cn(
            'border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
            active === t.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
