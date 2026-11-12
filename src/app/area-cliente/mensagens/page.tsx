import type { Metadata } from 'next'
import Link from 'next/link'
import { UnreadDot } from '@/components/portal/badges'
import { Surface } from '@/components/portal/surface'
import { Reveal } from '@/components/motion/reveal'
import { requireUser } from '@/lib/auth'
import { formatDate } from '@/lib/portal/labels'
import { getInbox } from '@/lib/portal/queries'

export const metadata: Metadata = { title: 'Mensagens' }

export default async function PortalInboxPage() {
  const profile = await requireUser()
  const inbox = await getInbox(profile.id)

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Mensagens da BillTech</h1>
        <p className="mt-2 text-muted-foreground">Novidades e comunicações da nossa equipa. Pode responder a qualquer uma delas.</p>
      </header>

      {inbox.length === 0 ? (
        <Surface tone="dashed" className="p-10 text-center text-muted-foreground">
          Ainda não recebeu mensagens. Quando a nossa equipa lhe escrever, aparece aqui (e avisamos por email).
        </Surface>
      ) : (
        <Surface as="ul" className="divide-y divide-border overflow-hidden">
          {inbox.map(({ broadcast, read_at }, i) => (
            <li key={broadcast.id}>
              <Reveal delay={Math.min(i, 5) * 0.05} y={12}>
                <Link href={`/area-cliente/mensagens/${broadcast.id}`} className="grid gap-1.5 p-5 transition-colors hover:bg-muted/60">
                  <span className="flex flex-wrap items-start justify-between gap-2">
                    <span className={read_at ? 'font-medium leading-snug' : 'font-bold leading-snug'}>{broadcast.subject}</span>
                    {!read_at && <UnreadDot label="Nova" />}
                  </span>
                  <span className="line-clamp-2 text-sm text-muted-foreground">{broadcast.body}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(broadcast.created_at)}</span>
                </Link>
              </Reveal>
            </li>
          ))}
        </Surface>
      )}
    </div>
  )
}
