import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { deleteClientProject } from '@/actions/portal'
import { ClientAccessForm } from '@/components/admin/editor/client-access-form'
import { ConfirmButton } from '@/components/admin/editor/confirm-button'
import { ProjectStageBadge, RequestStatusBadge } from '@/components/portal/badges'
import { ClientProjectForm } from '@/components/portal/forms'
import { getSiteContent } from '@/lib/content/get'
import { formatDate, requestTypeLabels } from '@/lib/portal/labels'
import { getProjects, getRequests } from '@/lib/portal/queries'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Ficha do cliente' }

export default async function AdminClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()

  const supabase = await createClient()
  const { data: client } = await supabase.from('profiles').select('id, email, full_name, company, created_at, role').eq('id', id).single()
  if (!client) notFound()

  const [{ solutions }, { data: assigned }, allProjects, allRequests] = await Promise.all([
    getSiteContent(),
    supabase.from('client_solutions').select('solution_id').eq('user_id', id),
    getProjects(),
    getRequests(),
  ])
  const projects = allProjects.filter((p) => p.client_id === id)
  const requests = allRequests.filter((r) => r.client_id === id)

  return (
    <div className="mx-auto grid max-w-4xl gap-8">
      <div>
        <Link href="/admin/clientes" className="mb-4 inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Clientes
        </Link>
        <h1 className="text-3xl font-black tracking-tight">{client.full_name || client.email}</h1>
        <p className="mt-1 text-muted-foreground">
          {client.email}
          {client.company ? ` · ${client.company}` : ''} · registado em {formatDate(client.created_at)}
        </p>
      </div>

      <section aria-labelledby="projetos" className="grid gap-4">
        <h2 id="projetos" className="text-xl font-bold">
          Projetos do cliente
        </h2>
        <p className="text-sm text-muted-foreground">O cliente vê estes projetos, a etapa e o progresso na área dele.</p>

        {projects.map((p) => (
          <details key={p.id} className="group rounded-2xl border border-border bg-card p-5">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 rounded-md">
              <span className="font-semibold">{p.name}</span>
              <span className="flex items-center gap-3">
                <ProjectStageBadge stage={p.status} />
                <span className="text-sm tabular-nums text-muted-foreground">{p.progress}%</span>
              </span>
            </summary>
            <div className="mt-5 grid gap-6 border-t border-border pt-5">
              <ClientProjectForm clientId={id} project={p} />
              <form action={deleteClientProject}>
                <input type="hidden" name="id" value={p.id} />
                <ConfirmButton message={`Apagar o projeto "${p.name}"? Os pedidos ligados ficam sem projeto.`} variant="ghost" size="sm" className="text-destructive">
                  <Trash2 aria-hidden /> Apagar projeto
                </ConfirmButton>
              </form>
            </div>
          </details>
        ))}

        <details className="rounded-2xl border border-dashed border-border p-5" open={projects.length === 0}>
          <summary className="cursor-pointer font-semibold">+ Novo projeto para este cliente</summary>
          <div className="mt-5">
            <ClientProjectForm clientId={id} />
          </div>
        </details>
      </section>

      <section aria-labelledby="pedidos" className="grid gap-4">
        <h2 id="pedidos" className="text-xl font-bold">
          Pedidos
        </h2>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este cliente ainda não fez pedidos.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {requests.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/pedidos/${r.id}`} className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-muted/60">
                  <span className="font-medium">{r.title}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {requestTypeLabels[r.type]} <RequestStatusBadge status={r.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="solucoes" className="grid gap-4">
        <h2 id="solucoes" className="text-xl font-bold">
          Soluções com acesso
        </h2>
        <div className="rounded-2xl border border-border bg-card p-5">
          <ClientAccessForm userId={id} solutions={solutions.items.map((s) => ({ id: s.id, title: s.title }))} assigned={(assigned ?? []).map((a) => a.solution_id as string)} />
        </div>
      </section>
    </div>
  )
}
