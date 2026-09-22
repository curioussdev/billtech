import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { ArrowLeft, Star } from 'lucide-react'
import { markRequestRead } from '@/actions/portal'
import { PriorityBadge, RequestStatusBadge } from '@/components/portal/badges'
import { ReplyForm, RequestMetaForm } from '@/components/portal/forms'
import { MessageThread } from '@/components/portal/message-thread'
import { requestTypeLabels } from '@/lib/portal/labels'
import { getProject, getRequestWithMessages } from '@/lib/portal/queries'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Pedido' }

export default async function AdminRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()

  const data = await getRequestWithMessages(id)
  if (!data) notFound()
  const { request, messages, attachments } = data

  if (request.admin_unread) await markRequestRead(request.id, 'admin')

  const supabase = await createClient()
  const [{ data: client }, project] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, company').eq('id', request.client_id).single(),
    request.project_id ? getProject(request.project_id) : Promise.resolve(null),
  ])
  const clientName = client?.full_name || client?.email || 'Cliente'

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/pedidos" className="mb-4 inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Pedidos
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="grid min-w-0 content-start gap-6">
          <header className="grid gap-3">
            <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">{request.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <RequestStatusBadge status={request.status} />
              <PriorityBadge priority={request.priority} />
              <span>{requestTypeLabels[request.type]}</span>
            </div>
          </header>

          <section aria-label="Conversa" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <MessageThread request={request} messages={messages} attachments={attachments} viewer="admin" clientName={clientName} />
          </section>

          <ReplyForm requestId={request.id} variant="admin" placeholder="Responda ao cliente (recebe também por email) ou marque como nota interna…" />
        </div>

        <aside className="grid content-start gap-6">
          <section aria-labelledby="gerir" className="rounded-2xl border border-border bg-card p-5">
            <h2 id="gerir" className="mb-4 text-base font-bold">
              Gerir pedido
            </h2>
            <RequestMetaForm requestId={request.id} status={request.status} priority={request.priority} />
          </section>

          <section aria-labelledby="cliente" className="rounded-2xl border border-border bg-card p-5 text-sm">
            <h2 id="cliente" className="mb-2 text-base font-bold">
              Cliente
            </h2>
            <p className="font-medium">{clientName}</p>
            {client?.company && <p className="text-muted-foreground">{client.company}</p>}
            <a href={`mailto:${client?.email}`} className="text-primary hover:underline">
              {client?.email}
            </a>
            <p className="mt-3">
              <Link href={`/admin/clientes/${request.client_id}`} className="font-medium text-primary hover:underline">
                Ver ficha do cliente
              </Link>
            </p>
            {project && (
              <p className="mt-3 text-muted-foreground">
                Projeto: <span className="font-medium text-foreground">{project.name}</span>
              </p>
            )}
            {request.satisfaction_rating && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Satisfação</p>
                <span className="flex items-center gap-0.5" aria-label={`${request.satisfaction_rating} de 5 estrelas`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} aria-hidden className={n <= request.satisfaction_rating! ? 'size-4 fill-amber-400 text-amber-400' : 'size-4 text-muted-foreground'} />
                  ))}
                </span>
                {request.satisfaction_comment && <p className="mt-1 italic text-muted-foreground">"{request.satisfaction_comment}"</p>}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
