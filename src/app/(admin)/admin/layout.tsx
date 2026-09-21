import type { Metadata } from 'next'
import { AppSidebar } from '@/components/admin/layout/AppSidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: { default: 'Admin', template: '%s | Admin BillTech' }, robots: { index: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Reforço de autorização (o proxy só faz a verificação otimista)
  const profile = await requireAdmin()
  const supabase = await createClient()
  const { count: unreadRequests } = await supabase.from('requests').select('id', { count: 'exact', head: true }).eq('admin_unread', true)

  return (
    <SidebarProvider>
      <AppSidebar email={profile.email} unreadRequests={unreadRequests ?? 0} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger aria-label="Abrir/fechar menu" />
          <span className="text-sm font-medium text-muted-foreground">Administração</span>
        </header>
        <main id="conteudo" className="min-w-0 px-4 py-8 sm:px-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
