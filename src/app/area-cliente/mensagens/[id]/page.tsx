import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { ArrowLeft, Reply } from 'lucide-react'
import { markBroadcastRead } from '@/actions/broadcast'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/auth'
import { formatDateTime } from '@/lib/portal/labels'
import { getInbox } from '@/lib/portal/queries'

export const metadata: Metadata = { title: 'Mensagem' }

export default async function PortalMessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()

  await requireUser()
  // A RLS só devolve comunicados em que este cliente é destinatário
  const message = (await getInbox()).find((m) => m.broadcast.id === id)
  if (!message) notFound()

  if (!message.read_at) await markBroadcastRead(id)

  const { broadcast } = message
  const replySubject = `Re: ${broadcast.subject}`.slice(0, 120)

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <Link href="/area-cliente/mensagens" className="inline-flex w-fit items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Mensagens
      </Link>

      <article className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <header>
          <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">{broadcast.subject}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Equipa BillTech · {formatDateTime(broadcast.created_at)}</p>
        </header>
        <div className="mt-6 whitespace-pre-wrap text-base leading-7">{broadcast.body}</div>
      </article>

      <div className="flex flex-wrap items-center gap-3">
        <Button render={<Link href={`/area-cliente/pedidos/novo?tipo=duvida&assunto=${encodeURIComponent(replySubject)}`} />} nativeButton={false} className="rounded-full">
          <Reply aria-hidden /> Responder à equipa
        </Button>
        <span className="text-sm text-muted-foreground">A sua resposta abre um pedido, onde continuamos a conversa.</span>
      </div>
    </div>
  )
}
