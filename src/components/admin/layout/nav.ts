import {
  Boxes,
  FileBarChart,
  FolderKanban,
  Gauge,
  Inbox,
  KanbanSquare,
  Layers,
  LifeBuoy,
  LayoutDashboard,
  MessageSquareQuote,
  ScrollText,
  Send,
  Search,
  Settings,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  /** Sub-itens (ex.: secções da landing) */
  children?: { title: string; href: string }[]
  /** Mostra o contador de pedidos por ler */
  badge?: 'requests'
  /** Corresponder apenas ao href exato (ex.: a home do admin) */
  exact?: boolean
}

export type NavGroup = { label: string; items: NavItem[] }

export const adminNav: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ title: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true }],
  },
  {
    label: 'Conteúdo',
    items: [
      {
        title: 'Hero & Seções',
        href: '/admin/conteudo/hero',
        icon: Layers,
        children: [
          { title: 'Início (Hero)', href: '/admin/conteudo/hero' },
          { title: 'Sobre', href: '/admin/conteudo/about' },
          { title: 'Serviços', href: '/admin/conteudo/services' },
          { title: 'Setores', href: '/admin/conteudo/sectors' },
          { title: 'Processo', href: '/admin/conteudo/process' },
          { title: 'Contacto', href: '/admin/conteudo/contact' },
          { title: 'Redes sociais', href: '/admin/conteudo/socials' },
        ],
      },
      { title: 'Projetos & Cases', href: '/admin/projetos', icon: FolderKanban },
      { title: 'Depoimentos', href: '/admin/depoimentos', icon: MessageSquareQuote },
      { title: 'SEO & Metadados', href: '/admin/conteudo/general', icon: Search },
      { title: 'Soluções de clientes', href: '/admin/conteudo/solutions', icon: Boxes },
    ],
  },
  {
    label: 'Negócio',
    items: [
      { title: 'Escritório Virtual', href: '/admin/crm', icon: Gauge },
      { title: 'Enviar mensagens', href: '/admin/comunicacoes', icon: Send },
      { title: 'Pedidos de clientes', href: '/admin/pedidos', icon: LifeBuoy, badge: 'requests' },
      { title: 'Receita & Projetos', href: '/admin/revenue', icon: Wallet },
      { title: 'Pipeline de Vendas', href: '/admin/pipeline', icon: KanbanSquare },
      { title: 'Prospecção de Clientes', href: '/admin/prospecting', icon: Target },
      { title: 'Relatórios', href: '/admin/reports', icon: FileBarChart },
      { title: 'Clientes', href: '/admin/clientes', icon: Users },
      { title: 'Mensagens', href: '/admin/mensagens', icon: Inbox },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { title: 'Configurações', href: '/admin/definicoes', icon: Settings },
      { title: 'Auditoria & Logs', href: '/admin/logs', icon: ScrollText },
    ],
  },
]

/** O item "Hero & Seções" agrupa as secções de conteúdo, exceto as que têm entrada própria. */
const OWN_ENTRY = ['/admin/conteudo/general', '/admin/conteudo/solutions']

export function isActive(pathname: string, item: Pick<NavItem, 'href' | 'exact' | 'children'>) {
  if (item.exact) return pathname === item.href
  if (item.children) return pathname.startsWith('/admin/conteudo/') && !OWN_ENTRY.some((p) => pathname.startsWith(p))
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
