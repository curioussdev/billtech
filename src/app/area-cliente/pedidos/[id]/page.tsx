import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { ArrowLeft, CheckCircle2, Star } from 'lucide-react'
import { cancelRequest, markRequestRead } from '@/actions/portal'
import { PriorityBadge, RequestStatusBadge } from '@/components/portal/badges'
import { ReplyForm } from '@/components/portal/forms'
import { MessageThread } from '@/components/portal/message-thread'
import { SatisfactionWidget } from '@/components/portal/satisfaction-widget'
import { Button } from '@/components/ui/button'
import { ConfirmButton } from '@/components/admin/editor/confirm-button'
import { requireUser } from '@/lib/auth'
import { OPEN_STATUSES, requestTypeLabels } from '@/lib/portal/labels'
import { getProject, getRequestWithMessages } from '@/lib/portal/queries'

export const metadata: Metadata = { title: 'Pedido' }

export default async function PortalRequestPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ novo?: string }> }) {
  const [{ id }, { novo }] = await Promise.all([params, searchParams])
  if (!z.uuid().safeParse(id).success) notFound()

  const profile = await requireUser()
  const data = await getRequestWithMessages(id)
  if (!data || data.request.client_id !== profile.id) notFound()
  const { request, messages, attachments } = data

  // Ler a conversa limpa o "por ler" do cliente
  if (request.client_unread) await markRequestRead(request.id, 'client')

  const project = request.project_id ? await getProject(request.project_id) : null
  const isOpen = OPEN_STATUSES.includes(request.status)

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <Link href="/area-cliente/pedidos" className="inline-flex w-fit items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Pedidos
      </Link>

      {novo && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <strong>Pedido enviado!</strong> A equipa BillTech foi notificada e responderá aqui e por email, normalmente em 1 dia útil.
          </span>
        </p>
      )}

      <header className="grid gap-3">
        <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">{request.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <RequestStatusBadge status={request.status} />
          <PriorityBadge priority={request.priority} />
          <span>{requestTypeLabels[request.type]}</span>
          {project && (
            <>
              <span aria-hidden>·</span>
              <Link href={`/area-cliente/projetos/${project.id}`} className="font-medium text-primary hover:underline">
                {project.name}
              </Link>
            </>
          )}
        </div>
        {request.status === 'aguarda_cliente' && (
          <p role="note" className="rounded-xl border border-orange-500/40 bg-orange-500/10 p-3 text-sm text-orange-900 dark:text-orange-200">
            A equipa precisa da sua resposta para continuar. Responda abaixo.
          </p>
        )}
      </header>

      <section aria-label="Conversa" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <MessageThread request={request} messages={messages} attachments={attachments} viewer="client" clientName={profile.full_name || profile.email} />
      </section>

      {request.status === 'concluido' &&
        (request.satisfaction_rating ? (
          <p className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-0.5" aria-hidden>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={n <= request.satisfaction_rating! ? 'size-4 fill-amber-400 text-amber-400' : 'size-4 text-muted-foreground'} />
              ))}
            </span>
            A sua avaliação, obrigado.
          </p>
        ) : (
          <SatisfactionWidget requestId={request.id} />
        ))}

      {request.status === 'cancelado' ? (
        <p className="text-sm text-muted-foreground">Este pedido foi cancelado. Se ainda precisar, abra um novo pedido.</p>
      ) : (
        <>
          <ReplyForm requestId={request.id} variant="client" placeholder={request.status === 'concluido' ? 'Precisa de mais alguma coisa neste pedido? Escreva aqui para o reabrir.' : 'Escreva a sua resposta ou acrescente detalhes…'} />
          {isOpen && (
            <form action={cancelRequest} className="flex justify-end">
              <input type="hidden" name="requestId" value={request.id} />
              <ConfirmButton message="Cancelar este pedido? A equipa será informada." variant="ghost" size="sm" className="text-muted-foreground">
                Cancelar pedido
              </ConfirmButton>
            </form>
          )}
        </>
      )}
      <Button render={<Link href="/area-cliente/pedidos/novo" />} nativeButton={false} variant="link" className="h-auto w-fit px-0">
        Tem outro assunto? Fazer um novo pedido
      </Button>
    </div>
  )
}
