import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, LayoutDashboard, LogOut } from 'lucide-react'
import { logout } from '@/actions/auth'
import { ClientMessageForm } from '@/components/auth/client-message-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/auth'
import { getSiteContent } from '@/lib/content/get'
import { getIcon } from '@/lib/icons'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Área de cliente', robots: { index: false } }

export default async function ClientAreaPage() {
  const profile = await requireUser()
  const supabase = await createClient()

  const [{ solutions }, { data: assigned }] = await Promise.all([
    getSiteContent(),
    supabase.from('client_solutions').select('solution_id').eq('user_id', profile.id),
  ])
  const assignedIds = new Set((assigned ?? []).map((row) => row.solution_id as string))
  const mySolutions = solutions.items.filter((s) => assignedIds.has(s.id))

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Voltar ao site
        </Link>
        <div className="flex items-center gap-2">
          {profile.role === 'admin' && (
            <Button render={<Link href="/admin" />} nativeButton={false} variant="outline" size="sm">
              <LayoutDashboard aria-hidden /> Dashboard
            </Button>
          )}
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut aria-hidden /> Sair
            </Button>
          </form>
        </div>
      </div>

      <header className="mt-10">
        <h1 className="text-4xl font-black tracking-tight">Olá, {profile.full_name || profile.email}</h1>
        <p className="mt-2 text-muted-foreground">
          {profile.company ? `${profile.company} · ` : ''}
          {profile.email}
        </p>
      </header>

      <section aria-labelledby="solucoes" className="mt-12">
        <h2 id="solucoes" className="text-2xl font-bold">
          As minhas soluções
        </h2>
        {mySolutions.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border p-6 text-muted-foreground">
            Ainda não tem soluções associadas à sua conta. A equipa BillTech irá disponibilizá-las aqui assim que estiverem prontas — pode também pedir uma abaixo.
          </p>
        ) : (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2">
            {mySolutions.map((solution) => {
              const Icon = getIcon(solution.icon)
              const isExternal = /^https?:/i.test(solution.url)
              return (
                <li key={solution.id} className="flex flex-col rounded-3xl border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon aria-hidden />
                    </span>
                    <Badge variant={solution.status === 'ativo' ? 'default' : 'outline'} className="h-auto px-2.5 py-1">
                      {solution.status === 'ativo' ? 'Ativo' : 'Em breve'}
                    </Badge>
                  </div>
                  <h3 className="mt-4 text-xl font-bold">{solution.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{solution.description}</p>
                  {solution.url && solution.status === 'ativo' && (
                    <Button
                      render={<Link href={solution.url} {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})} />}
                      nativeButton={false}
                      className="mt-5 w-fit rounded-full px-5"
                    >
                      Abrir <ArrowUpRight data-icon="inline-end" aria-hidden />
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="mensagem" className="mt-14 rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h2 id="mensagem" className="text-2xl font-bold">
          Falar diretamente com a BillTech
        </h2>
        <p className="mb-6 mt-2 text-muted-foreground">A sua mensagem chega diretamente à equipa, já associada à sua conta.</p>
        <ClientMessageForm />
      </section>
    </main>
  )
}
