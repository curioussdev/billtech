import type { Metadata } from 'next'
import Link from 'next/link'
import { Send } from 'lucide-react'
import { Forbidden } from '@/components/admin/layout/forbidden'
import { Button } from '@/components/ui/button'
import { getSuperAdminOrNull } from '@/lib/auth'
import { formatDateTime } from '@/lib/portal/labels'
import { createClient } from '@/lib/supabase/server'
import type { Broadcast, EmailStatus } from '@/types/portal'

export const metadata: Metadata = { title: 'Enviar mensagens' }

export default async function BroadcastsPage() {
  if (!(await getSuperAdminOrNull())) return <Forbidden what="O envio de mensagens aos clientes" />

  const supabase = await createClient()
  const { data } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false }).limit(100)
  const broadcasts = (data ?? []) as Broadcast[]

  const { data: recipients } = broadcasts.length
    ? await supabase.from('broadcast_recipients').select('broadcast_id, read_at, email_status').in('broadcast_id', broadcasts.map((b) => b.id))
    : { data: [] }
  const stats = new Map<string, { read: number; sent: number; failed: number }>()
  for (const r of recipients ?? []) {
    const s = stats.get(r.broadcast_id) ?? { read: 0, sent: 0, failed: 0 }
    if (r.read_at) s.read++
    if ((r.email_status as EmailStatus) === 'sent') s.sent++
    if ((r.email_status as EmailStatus) === 'failed') s.failed++
    stats.set(r.broadcast_id, s)
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Enviar mensagens</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Comunicados para um cliente, vários ou todos. Chegam ao portal do cliente e, se quiser, por email. O cliente pode responder e a conversa segue como pedido.</p>
        </div>
        <Button render={<Link href="/admin/comunicacoes/nova" />} nativeButton={false}>
          <Send aria-hidden /> Nova mensagem
        </Button>
      </div>

      <h2 className="mb-3 mt-10 text-xl font-bold">Histórico</h2>
      {broadcasts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-muted-foreground">Ainda não enviou nenhuma mensagem.</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {broadcasts.map((b) => {
            const s = stats.get(b.id) ?? { read: 0, sent: 0, failed: 0 }
            return (
              <li key={b.id}>
                <Link href={`/admin/comunicacoes/${b.id}`} className="grid gap-1.5 p-5 transition-colors hover:bg-muted/60">
                  <span className="font-semibold leading-snug">{b.subject}</span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{formatDateTime(b.created_at)}</span>
                    <span>por {b.admin_email}</span>
                    <span>{b.audience === 'all' ? 'Todos os clientes' : 'Seleção'} · {b.recipient_count} {b.recipient_count === 1 ? 'destinatário' : 'destinatários'}</span>
                    <span>{s.read} leram</span>
                    {b.email_requested ? <span>{s.sent} emails enviados{s.failed ? `, ${s.failed} falharam` : ''}</span> : <span>Sem email</span>}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
