'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { RequestAttachment, RequestMessage } from '@/types/portal'

/**
 * Conversa de um pedido em direto: novas respostas e anexos aparecem sem recarregar a página. A RLS
 * de `request_messages` já filtra notas internas do lado do cliente, por isso o subscritor só recebe
 * o que teria direito a ver numa leitura normal.
 */
export function useRealtimeMessages(requestId: string, initialMessages: RequestMessage[], initialAttachments: RequestAttachment[]) {
  const [messages, setMessages] = useState(initialMessages)
  const [attachments, setAttachments] = useState(initialAttachments)

  useEffect(() => setMessages(initialMessages), [initialMessages])
  useEffect(() => setAttachments(initialAttachments), [initialAttachments])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const supabase = createClient()
    const channel = supabase
      .channel(`request-${requestId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'request_messages', filter: `request_id=eq.${requestId}` }, (payload) => {
        const row = payload.new as RequestMessage
        setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'request_attachments', filter: `request_id=eq.${requestId}` }, (payload) => {
        if (payload.eventType === 'DELETE') return
        const row = payload.new as RequestAttachment
        setAttachments((prev) => [...prev.filter((a) => a.id !== row.id), row])
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [requestId])

  return { messages, attachments }
}

/** Cliente: atualiza os contadores "por ler" (pedidos, comunicados) assim que algo muda no servidor. */
export function useClientPortalRealtime(clientId: string) {
  const router = useRouter()

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const supabase = createClient()
    const channel = supabase
      .channel(`portal-nav-${clientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests', filter: `client_id=eq.${clientId}` }, () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcast_recipients', filter: `client_id=eq.${clientId}` }, () => router.refresh())
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [clientId, router])
}

/** Admin: atualiza o contador de pedidos por ler na sidebar assim que um pedido é criado ou lido. */
export function useAdminRequestsRealtime() {
  const router = useRouter()

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const supabase = createClient()
    const channel = supabase
      .channel('admin-requests-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => router.refresh())
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [router])
}
