import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import { BroadcastForm } from '@/components/admin/broadcast-form'
import { Forbidden } from '@/components/admin/layout/forbidden'
import { getSuperAdminOrNull } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Nova mensagem' }

export default async function NewBroadcastPage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  if (!(await getSuperAdminOrNull())) return <Forbidden what="O envio de mensagens aos clientes" />

  const { cliente } = await searchParams
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('id, email, full_name, company').eq('role', 'client').order('full_name', { ascending: true })
  const clients = (data ?? []).map((c) => ({ id: c.id as string, name: c.full_name as string, email: c.email as string, company: c.company as string }))

  // ?cliente=<id> abre a mensagem já dirigida a esse cliente (ex.: a partir da ficha)
  const preselected = z.uuid().safeParse(cliente).success && clients.some((c) => c.id === cliente) ? [cliente as string] : []

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/comunicacoes" className="mb-4 inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Mensagens enviadas
      </Link>
      <h1 className="text-3xl font-black tracking-tight">Nova mensagem</h1>
      <p className="mb-8 mt-2 text-muted-foreground">Escolha os destinatários e escreva. Antes de enviar a mais do que um cliente, pedimos confirmação.</p>
      <BroadcastForm clients={clients} preselected={preselected} />
    </div>
  )
}
