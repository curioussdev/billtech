'use client'

import { useEffect, useState } from 'react'
import type { RealtimeUsers } from '@/types/analytics'

const ENDPOINT = '/api/admin/realtime'

/** Polling do número de utilizadores online. Pausa quando o separador está oculto. */
export function useRealtimeUsers(initial: RealtimeUsers, intervalMs = 15_000) {
  const [data, setData] = useState<RealtimeUsers>(initial)
  const [error, setError] = useState(false)

  useEffect(() => {
    let controller: AbortController | null = null

    async function poll() {
      if (document.hidden) return
      controller?.abort()
      controller = new AbortController()
      try {
        const response = await fetch(ENDPOINT, { cache: 'no-store', signal: controller.signal })
        if (!response.ok) throw new Error(String(response.status))
        setData((await response.json()) as RealtimeUsers)
        setError(false)
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setError(true)
      }
    }

    const timer = window.setInterval(poll, intervalMs)
    const onVisible = () => !document.hidden && void poll()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      controller?.abort()
    }
  }, [intervalMs])

  return { data, error }
}
