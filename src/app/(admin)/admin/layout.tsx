import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink, LogOut } from 'lucide-react'
import { logout } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { requireAdmin } from '@/lib/auth'
import { contentEditors } from '@/lib/content/editor-config'
import type { ContentKey } from '@/lib/content/schema'

export const metadata: Metadata = { title: { default: 'Dashboard', template: '%s | Dashboard' }, robots: { index: false } }

const extraLinks = [
  { href: '/admin/projetos', label: 'Projetos' },
  { href: '/admin/clientes', label: 'Clientes' },
  { href: '/admin/mensagens', label: 'Mensagens' },
  { href: '/admin/definicoes', label: 'Definições' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin()
  const contentLinks = (Object.keys(contentEditors) as ContentKey[]).map((key) => ({ href: `/admin/conteudo/${key}`, label: contentEditors[key].title }))

  const linkClass = 'block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground'

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-border bg-card lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-2 p-4">
          <Link href="/admin" className="text-lg font-black tracking-tight">
            Dashboard
          </Link>
          <ThemeToggle />
        </div>
        <nav aria-label="Dashboard" className="grid gap-6 px-3 pb-4">
          <div>
            <p className="px-3 pb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Conteúdo da landing</p>
            <ul className="flex flex-wrap gap-1 lg:block">
              {contentLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="px-3 pb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Gestão</p>
            <ul className="flex flex-wrap gap-1 lg:block">
              {extraLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-2 border-t border-border pt-4">
            <p className="truncate px-3 text-xs text-muted-foreground">{profile.email}</p>
            <Button render={<Link href="/" target="_blank" />} nativeButton={false} variant="outline" size="sm">
              <ExternalLink aria-hidden /> Ver site
            </Button>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm" className="w-full">
                <LogOut aria-hidden /> Sair
              </Button>
            </form>
          </div>
        </nav>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8">{children}</main>
    </div>
  )
}
