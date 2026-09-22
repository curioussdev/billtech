import type { Metadata } from 'next'
import { MessagesTabs } from '@/components/admin/layout/messages-tabs'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Mensagens' }

export default async function MessagesAdminPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('contact_messages').select('id, user_id, name, email, whatsapp, challenge, email_sent, created_at').order('created_at', { ascending: false }).limit(200)
  const messages = data ?? []

  return (
    <div className="max-w-4xl">
      <MessagesTabs active="recebidas" />
      <h1 className="text-3xl font-black tracking-tight">Mensagens recebidas</h1>
      <p className="mb-8 mt-2 text-muted-foreground">Pedidos recebidos pelo formulário e pela área de cliente (últimas 200).</p>

      {messages.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-muted-foreground">Ainda não há mensagens.</p>
      ) : (
        <ul className="grid gap-4">
          {messages.map((m) => (
            <li key={m.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{m.name}</p>
                <Badge variant="outline" className="h-auto px-2 py-0.5">
                  {m.user_id ? 'Cliente' : 'Site'}
                </Badge>
                {!m.email_sent && (
                  <Badge variant="destructive" className="h-auto px-2 py-0.5">
                    Email não enviado
                  </Badge>
                )}
                <time dateTime={m.created_at} className="ml-auto text-xs text-muted-foreground">
                  {new Date(m.created_at).toLocaleString('pt-PT')}
                </time>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                <a href={`mailto:${m.email}`} className="underline underline-offset-2">
                  {m.email}
                </a>
                {m.whatsapp ? ` · ${m.whatsapp}` : ''}
              </p>
              <p className="mt-3 whitespace-pre-wrap">{m.challenge}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
