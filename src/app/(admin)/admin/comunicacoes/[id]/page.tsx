import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { Forbidden } from '@/components/admin/layout/forbidden'
import { getSuperAdminOrNull } from '@/lib/auth'
import { formatDateTime } from '@/lib/portal/labels'
import { createClient } from '@/lib/supabase/server'
import type { Broadcast, EmailStatus } from '@/types/portal'

export const metadata: Metadata = { title: 'Mensagem enviada' }

const emailLabels: Record<EmailStatus, string> = { sent: 'Enviado', failed: 'Falhou', skipped: 'Não pedido' }

export default async function BroadcastDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getSuperAdminOrNull())) return <Forbidden what="O envio de mensagens aos clientes" />

  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()

  const supabase = await createClient()
  const { data: broadcast } = await supabase.from('broadcasts').select('*').eq('id', id).maybeSingle()
  if (!broadcast) notFound()
  const b = broadcast as Broadcast

  const { data: recipients } = await supabase.from('broadcast_recipients').select('client_id, read_at, email_status, profiles(full_name, email, company)').eq('broadcast_id', id)
  type Row = { client_id: string; read_at: string | null; email_status: EmailStatus; profiles: { full_name: string; email: string; company: string } | null }
  const rows = (recipients ?? []) as unknown as Row[]

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/comunicacoes" className="mb-4 inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Mensagens enviadas
      </Link>
      <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">{b.subject}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {formatDateTime(b.created_at)} · por {b.admin_email} · {b.audience === 'all' ? 'todos os clientes' : 'seleção'} · {b.recipient_count} destinatários · {rows.filter((r) => r.read_at).length} leram
      </p>

      <section aria-label="Mensagem" className="mt-6 whitespace-pre-wrap rounded-2xl border border-border bg-card p-5 text-sm leading-6">
        {b.body}
      </section>

      <h2 className="mb-3 mt-10 text-xl font-bold">Destinatários</h2>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[560px] text-left text-sm">
          <caption className="sr-only">Destinatários, leitura e estado do email</caption>
          <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">Cliente</th>
              <th scope="col" className="px-4 py-3">Leitura</th>
              <th scope="col" className="px-4 py-3">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.client_id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/clientes/${r.client_id}`} className="font-medium hover:underline">
                    {r.profiles?.full_name || r.profiles?.email}
                  </Link>
                  <span className="block text-xs text-muted-foreground">
                    {r.profiles?.email}
                    {r.profiles?.company ? ` · ${r.profiles.company}` : ''}
                  </span>
                </td>
                <td className="px-4 py-3">{r.read_at ? `Lida a ${formatDateTime(r.read_at)}` : 'Por ler'}</td>
                <td className={`px-4 py-3 ${r.email_status === 'failed' ? 'font-semibold text-destructive' : ''}`}>{emailLabels[r.email_status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
