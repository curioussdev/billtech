import type { Metadata } from 'next'
import Link from 'next/link'
import { Code2, LayoutDashboard, LogOut, MessageCircle, Plus } from 'lucide-react'
import { logout } from '@/actions/auth'
import { PortalNav } from '@/components/portal/portal-nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/auth'
import { getSiteContent } from '@/lib/content/get'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: { default: 'Área de cliente', template: '%s | Área de cliente' }, robots: { index: false } }

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser()
  const supabase = await createClient()
  const [{ count }, { general }] = await Promise.all([
    supabase.from('requests').select('id', { count: 'exact', head: true }).eq('client_id', profile.id).eq('client_unread', true),
    getSiteContent(),
  ])

  return (
    <div className="min-h-screen bg-muted/30">
      <a href="#conteudo" className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground transition-transform focus:translate-y-0">
        Saltar para o conteúdo
      </a>
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 lg:px-8">
          <Link href="/area-cliente" className="flex items-center gap-2 rounded-md font-black tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Code2 className="size-4" aria-hidden />
            </span>
            {general.brandName}
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline">· Área de cliente</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button render={<Link href="/area-cliente/pedidos/novo" />} nativeButton={false} size="sm" className="rounded-full">
              <Plus aria-hidden /> <span className="hidden sm:inline">Novo pedido</span>
              <span className="sm:hidden">Pedido</span>
            </Button>
            {profile.role === 'admin' && (
              <Button render={<Link href="/admin" />} nativeButton={false} variant="ghost" size="sm">
                <LayoutDashboard aria-hidden /> <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            <ThemeToggle />
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm" aria-label="Terminar sessão">
                <LogOut aria-hidden /> <span className="hidden sm:inline">Sair</span>
              </Button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <PortalNav unread={count ?? 0} />
        </div>
      </header>

      <main id="conteudo" className="mx-auto max-w-6xl px-4 py-8 lg:px-8 lg:py-10">
        {children}
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>Precisa de falar com uma pessoa? Estamos a um clique de distância.</p>
          <div className="flex flex-wrap gap-4">
            {general.whatsappUrl && (
              <a href={general.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary">
                <MessageCircle className="size-4" aria-hidden /> WhatsApp<span className="sr-only"> (abre num novo separador)</span>
              </a>
            )}
            <Link href="/" className="hover:text-foreground">
              Voltar ao site
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
