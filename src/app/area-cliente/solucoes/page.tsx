import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/auth'
import { getSiteContent } from '@/lib/content/get'
import { getIcon } from '@/lib/icons'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Soluções' }

export default async function PortalSolutionsPage() {
  const profile = await requireUser()
  const supabase = await createClient()
  const [{ solutions }, { data: assigned }] = await Promise.all([getSiteContent(), supabase.from('client_solutions').select('solution_id').eq('user_id', profile.id)])
  const ids = new Set((assigned ?? []).map((row) => row.solution_id as string))
  const mine = solutions.items.filter((s) => ids.has(s.id))

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Soluções</h1>
        <p className="mt-2 text-muted-foreground">Ferramentas e plataformas disponibilizadas na sua conta.</p>
      </header>

      {mine.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-muted-foreground">
          Ainda não tem soluções associadas. Quando a equipa BillTech ativar uma para si, aparece aqui. Quer sugerir uma?{' '}
          <Link href="/area-cliente/pedidos/novo?tipo=implementacao" className="font-medium text-primary hover:underline">
            Faça um pedido
          </Link>
          .
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {mine.map((solution) => {
            const Icon = getIcon(solution.icon)
            const external = /^https?:/i.test(solution.url)
            return (
              <li key={solution.id} className="flex flex-col rounded-2xl border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon aria-hidden />
                  </span>
                  <Badge variant={solution.status === 'ativo' ? 'default' : 'outline'} className="h-auto px-2.5 py-1">
                    {solution.status === 'ativo' ? 'Ativo' : 'Em breve'}
                  </Badge>
                </div>
                <h2 className="mt-4 text-xl font-bold">{solution.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{solution.description}</p>
                {solution.url && solution.status === 'ativo' && (
                  <Button render={<Link href={solution.url} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} />} nativeButton={false} className="mt-5 w-fit rounded-full px-5">
                    Abrir <ArrowUpRight data-icon="inline-end" aria-hidden />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
