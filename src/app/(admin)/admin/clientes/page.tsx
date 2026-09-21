import type { Metadata } from 'next'
import { ClientAccessForm } from '@/components/admin/editor/client-access-form'
import { getSiteContent } from '@/lib/content/get'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Clientes' }

export default async function ClientsAdminPage() {
  const supabase = await createClient()
  const [{ solutions }, { data: profiles }, { data: assignments }] = await Promise.all([
    getSiteContent(),
    supabase.from('profiles').select('id, email, full_name, company, created_at').eq('role', 'client').order('created_at', { ascending: false }),
    supabase.from('client_solutions').select('user_id, solution_id'),
  ])

  const byUser = new Map<string, string[]>()
  for (const a of assignments ?? []) byUser.set(a.user_id, [...(byUser.get(a.user_id) ?? []), a.solution_id])

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-black tracking-tight">Clientes</h1>
      <p className="mb-8 mt-2 text-muted-foreground">Contas criadas em «Entrar → Criar conta». Escolha que soluções cada cliente vê na sua área.</p>

      {(profiles ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-muted-foreground">Ainda não há clientes registados.</p>
      ) : (
        <ul className="grid gap-4">
          {(profiles ?? []).map((p) => (
            <li key={p.id} className="rounded-2xl border border-border bg-card p-5">
              <p className="font-semibold">{p.full_name || p.email}</p>
              <p className="mb-4 text-sm text-muted-foreground">
                {p.email}
                {p.company ? ` · ${p.company}` : ''} · registado em {new Date(p.created_at).toLocaleDateString('pt-PT')}
              </p>
              <ClientAccessForm userId={p.id} solutions={solutions.items.map((s) => ({ id: s.id, title: s.title }))} assigned={byUser.get(p.id) ?? []} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
