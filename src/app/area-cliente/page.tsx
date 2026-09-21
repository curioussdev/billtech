import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, FolderKanban, Inbox, MessageCircle, Sparkles, Wrench, Bug, Calculator, LifeBuoy } from 'lucide-react'
import { RequestStatusBadge, UnreadDot } from '@/components/portal/badges'
import { ProjectCard } from '@/components/portal/project-widgets'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/auth'
import { getSiteContent } from '@/lib/content/get'
import { formatDate, OPEN_STATUSES, requestTypeLabels } from '@/lib/portal/labels'
import { getProjects, getRequests } from '@/lib/portal/queries'

export const metadata: Metadata = { title: 'Visão geral' }

const quickActions = [
  { type: 'alteracao', title: 'Pedir uma alteração', text: 'Mudar ou melhorar algo que já existe.', icon: Wrench },
  { type: 'implementacao', title: 'Nova funcionalidade', text: 'Uma integração, automação ou módulo novo.', icon: Sparkles },
  { type: 'suporte', title: 'Reportar um problema', text: 'Algo não funciona como esperado.', icon: Bug },
  { type: 'orcamento', title: 'Pedir orçamento', text: 'Custo e prazo de um novo trabalho.', icon: Calculator },
] as const

export default async function PortalHomePage() {
  const profile = await requireUser()
  const [projects, requests, { general }] = await Promise.all([getProjects(), getRequests(), getSiteContent()])

  const activeProjects = projects.filter((p) => p.status !== 'entregue' && p.status !== 'manutencao')
  const openRequests = requests.filter((r) => OPEN_STATUSES.includes(r.status))
  const unread = requests.filter((r) => r.client_unread)
  const firstName = (profile.full_name || profile.email).split(/[\s@]/)[0]

  return (
    <div className="grid gap-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Olá, {firstName}</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            {profile.company ? `${profile.company} · ` : ''}Aqui acompanha os seus projetos e fala diretamente com a nossa equipa. Sem formalidades: se precisar de algo, peça.
          </p>
        </div>
        <Button render={<Link href="/area-cliente/pedidos/novo" />} nativeButton={false} size="lg" className="h-11 rounded-full px-6">
          Fazer um pedido <ArrowRight data-icon="inline-end" aria-hidden />
        </Button>
      </header>

      <section aria-label="Resumo" className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Projetos em curso', value: activeProjects.length, href: '/area-cliente/projetos', icon: FolderKanban },
          { label: 'Pedidos em aberto', value: openRequests.length, href: '/area-cliente/pedidos', icon: Inbox },
          { label: 'Mensagens por ler', value: unread.length, href: '/area-cliente/pedidos', icon: MessageCircle, highlight: unread.length > 0 },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary">
            <span className={`flex size-11 items-center justify-center rounded-xl ${stat.highlight ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
              <stat.icon aria-hidden />
            </span>
            <span>
              <strong className="block text-2xl font-black tabular-nums">{stat.value}</strong>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </span>
          </Link>
        ))}
      </section>

      <section aria-labelledby="como-ajudar">
        <h2 id="como-ajudar" className="text-xl font-bold">
          Como podemos ajudar?
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <li key={action.type}>
              <Link href={`/area-cliente/pedidos/novo?tipo=${action.type}`} className="group flex h-full flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <action.icon className="size-5" aria-hidden />
                </span>
                <span className="font-semibold">{action.title}</span>
                <span className="text-sm text-muted-foreground">{action.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="projetos">
          <div className="flex items-center justify-between">
            <h2 id="projetos" className="text-xl font-bold">
              Os seus projetos
            </h2>
            <Link href="/area-cliente/projetos" className="text-sm font-medium text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          {projects.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
              Ainda não há projetos na sua conta. Assim que iniciarmos o primeiro, acompanha aqui o progresso, etapas e datas.
            </p>
          ) : (
            <ul className="mt-4 grid gap-4">
              {projects.slice(0, 3).map((project) => (
                <li key={project.id}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid content-start gap-10">
          <section aria-labelledby="pedidos">
            <div className="flex items-center justify-between">
              <h2 id="pedidos" className="text-xl font-bold">
                Pedidos recentes
              </h2>
              <Link href="/area-cliente/pedidos" className="text-sm font-medium text-primary hover:underline">
                Ver todos
              </Link>
            </div>
            {requests.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">Ainda não fez nenhum pedido. É simples: use «Fazer um pedido» acima.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {requests.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    <Link href={`/area-cliente/pedidos/${r.id}`} className="flex flex-col gap-1.5 p-4 transition-colors hover:bg-muted/60">
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-medium leading-snug">{r.title}</span>
                        {r.client_unread && <UnreadDot label="Nova resposta" />}
                      </span>
                      <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <RequestStatusBadge status={r.status} />
                        {requestTypeLabels[r.type]} · {formatDate(r.last_message_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="contacto" className="rounded-2xl border border-border bg-card p-5">
            <h2 id="contacto" className="flex items-center gap-2 text-lg font-bold">
              <LifeBuoy className="size-5 text-primary" aria-hidden /> A sua equipa
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Responsável pela sua conta: <strong className="text-foreground">{general.author}</strong>. Respondemos aos pedidos normalmente em 1 dia útil.</p>
            {general.whatsappUrl && (
              <Button render={<a href={general.whatsappUrl} target="_blank" rel="noopener noreferrer" />} nativeButton={false} variant="outline" size="sm" className="mt-4">
                <MessageCircle aria-hidden /> Falar por WhatsApp<span className="sr-only"> (abre num novo separador)</span>
              </Button>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
