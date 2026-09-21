import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { contentEditors } from '@/lib/content/editor-config'
import type { ContentKey } from '@/lib/content/schema'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardHome() {
  const supabase = await createClient()
  const [messages, clients, projects] = await Promise.all([
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'client'),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Mensagens recebidas', value: messages.count ?? 0, href: '/admin/mensagens' },
    { label: 'Clientes registados', value: clients.count ?? 0, href: '/admin/clientes' },
    { label: 'Projetos', value: projects.count ?? 0, href: '/admin/projetos' },
  ]

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-black tracking-tight">Painel de controlo</h1>
      <p className="mt-2 text-muted-foreground">Tudo o que aparece na landing page pode ser editado aqui. As alterações ficam públicas assim que guardar.</p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="block rounded-2xl border border-border bg-card p-5 hover:border-primary">
              <strong className="block text-3xl font-black">{s.value}</strong>
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-xl font-bold">Editar secções</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {(Object.keys(contentEditors) as ContentKey[]).map((key) => (
          <li key={key}>
            <Link href={`/admin/conteudo/${key}`} className="group flex h-full items-start justify-between gap-3 rounded-2xl border border-border p-4 hover:border-primary">
              <span>
                <span className="block font-semibold">{contentEditors[key].title}</span>
                <span className="text-sm text-muted-foreground">{contentEditors[key].description}</span>
              </span>
              <ArrowRight className="mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
