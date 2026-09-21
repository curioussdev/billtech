import type { Metadata } from 'next'
import Link from 'next/link'
import { UnreadDot } from '@/components/portal/badges'
import { formatDate } from '@/lib/portal/labels'
import { getInbox } from '@/lib/portal/queries'

export const metadata: Metadata = { title: 'Mensagens' }

export default async function PortalInboxPage() {
  const inbox = await getInbox()

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Mensagens da BillTech</h1>
        <p className="mt-2 text-muted-foreground">Novidades e comunicações da nossa equipa. Pode responder a qualquer uma delas.</p>
      </header>

      {inbox.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          Ainda não recebeu mensagens. Quando a nossa equipa lhe escrever, aparece aqui (e avisamos por email).
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {inbox.map(({ broadcast, read_at }) => (
            <li key={broadcast.id}>
              <Link href={`/area-cliente/mensagens/${broadcast.id}`} className="grid gap-1.5 p-5 transition-colors hover:bg-muted/60">
                <span className="flex flex-wrap items-start justify-between gap-2">
                  <span className={read_at ? 'font-medium leading-snug' : 'font-bold leading-snug'}>{broadcast.subject}</span>
                  {!read_at && <UnreadDot label="Nova" />}
                </span>
                <span className="line-clamp-2 text-sm text-muted-foreground">{broadcast.body}</span>
                <span className="text-xs text-muted-foreground">{formatDate(broadcast.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
