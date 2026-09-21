import { LockKeyhole } from 'lucide-react'
import { formatDateTime } from '@/lib/portal/labels'
import { cn } from '@/lib/utils'
import type { PortalRequest, RequestMessage } from '@/types/portal'

type Viewer = 'client' | 'admin'

function Bubble({ mine, author, time, internal, children }: { mine: boolean; author: string; time: string; internal?: boolean; children: React.ReactNode }) {
  return (
    <li className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{author}</span>
        <time>{time}</time>
        {internal && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 font-semibold text-amber-900 dark:text-amber-300">
            <LockKeyhole className="size-3" aria-hidden /> Nota interna
          </span>
        )}
      </div>
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[75%]',
          internal ? 'border border-dashed border-amber-500/60 bg-amber-500/10' : mine ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-muted',
        )}
      >
        {children}
      </div>
    </li>
  )
}

/** Conversa de um pedido: a descrição inicial é a primeira mensagem do cliente. */
export function MessageThread({ request, messages, viewer, clientName }: { request: PortalRequest; messages: RequestMessage[]; viewer: Viewer; clientName: string }) {
  return (
    <ol className="grid gap-5" aria-label="Conversa do pedido">
      <Bubble mine={viewer === 'client'} author={viewer === 'client' ? 'Você' : clientName} time={formatDateTime(request.created_at)}>
        {request.description}
      </Bubble>
      {messages.map((m) => {
        const fromClient = m.author_role === 'client'
        const mine = viewer === 'client' ? fromClient : !fromClient
        const author = fromClient ? (viewer === 'client' ? 'Você' : clientName) : viewer === 'admin' ? 'BillTech (equipa)' : 'Equipa BillTech'
        return (
          <Bubble key={m.id} mine={mine} author={author} time={formatDateTime(m.created_at)} internal={m.internal}>
            {m.body}
          </Bubble>
        )
      })}
    </ol>
  )
}
