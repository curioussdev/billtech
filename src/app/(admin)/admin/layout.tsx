import type { Metadata } from 'next'
import { ExcludeFromAnalytics } from '@/components/analytics-tracker'
import { AppSidebar } from '@/components/admin/layout/AppSidebar'
import { FastLogModal } from '@/components/admin/crm/fast-log-modal'
import { ToastProvider } from '@/components/admin/crm/toast'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { listLeads } from '@/lib/admin/analytics'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: { default: 'Admin', template: '%s | Admin BillTech' }, robots: { index: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Reforço de autorização (o proxy só faz a verificação otimista)
  const profile = await requireAdmin()
  const supabase = await createClient()
  const [{ count: unreadRequests }, leads] = await Promise.all([
    supabase.from('requests').select('id', { count: 'exact', head: true }).eq('admin_unread', true),
    listLeads(),
  ])

  return (
    <ToastProvider>
      <SidebarProvider>
        <ExcludeFromAnalytics />
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
        {/* Fast-Log: FAB + Cmd/Ctrl+K, disponível em toda a área de admin */}
        <FastLogModal leads={leads.map((l) => ({ id: l.id, company: l.company, stage: l.stage }))} />
      </SidebarProvider>
    </ToastProvider>
  )
}
