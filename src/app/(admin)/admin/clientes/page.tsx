import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatDate, OPEN_STATUSES } from '@/lib/portal/labels'
import { getProjects, getRequests } from '@/lib/portal/queries'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Clientes' }

export default async function ClientsAdminPage() {
  const supabase = await createClient()
  const [{ data: profiles }, projects, requests] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name, company, created_at').eq('role', 'client').order('created_at', { ascending: false }),
    getProjects(),
    getRequests(),
  ])

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-black tracking-tight">Clientes</h1>
      <p className="mb-8 mt-2 text-muted-foreground">Contas criadas em «Entrar → Criar conta». Abra a ficha para gerir projetos, pedidos e acessos.</p>

      {(profiles ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-muted-foreground">Ainda não há clientes registados.</p>
      ) : (
        <ul className="grid gap-3">
          {(profiles ?? []).map((p) => {
            const open = requests.filter((r) => r.client_id === p.id && OPEN_STATUSES.includes(r.status)).length
            const unread = requests.filter((r) => r.client_id === p.id && r.admin_unread).length
            return (
              <li key={p.id}>
                <Link href={`/admin/clientes/${p.id}`} className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary">
                  <span>
                    <span className="block font-semibold">{p.full_name || p.email}</span>
                    <span className="text-sm text-muted-foreground">
                      {p.email}
                      {p.company ? ` · ${p.company}` : ''} · desde {formatDate(p.created_at)}
                    </span>
                  </span>
                  <span className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{projects.filter((x) => x.client_id === p.id).length} projetos</span>
                    <span>{open} pedidos abertos</span>
                    {unread > 0 && <span className="font-semibold text-primary">{unread} por ler</span>}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
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
