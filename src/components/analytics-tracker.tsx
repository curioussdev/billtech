'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const ENDPOINT = '/api/track'
const HEARTBEAT_MS = 30_000
export const OPT_OUT_KEY = 'bt_no_track'

function sessionId(): string {
  try {
    let sid = sessionStorage.getItem('bt_sid')
    if (!sid) {
      sid = crypto.randomUUID()
      sessionStorage.setItem('bt_sid', sid)
    }
    return sid
  } catch {
    return crypto.randomUUID() // sessionStorage bloqueado: sessão só em memória
  }
}

function optedOut(): boolean {
  try {
    return navigator.doNotTrack === '1' || localStorage.getItem(OPT_OUT_KEY) === '1'
  } catch {
    return navigator.doNotTrack === '1'
  }
}

function send(kind: 'view' | 'beat', sid: string, path: string) {
  const payload = JSON.stringify({ kind, sid, path, referrer: kind === 'view' ? document.referrer : undefined })
  // keepalive: sobrevive à navegação; falhas são silenciosas (analytics nunca pode afetar o site)
  fetch(ENDPOINT, { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => undefined)
}

/**
 * Analytics próprio, sem cookies: regista cada página vista e envia um "batimento" a cada 30 s
 * enquanto o separador está visível, para saber quem está online agora.
 * Respeita "Do Not Track" e ignora os navegadores dos administradores.
 */
export function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (optedOut()) return
    const sid = sessionId()

    send('view', sid, pathname)
    const timer = window.setInterval(() => {
      if (!document.hidden) send('beat', sid, pathname)
    }, HEARTBEAT_MS)
    const onVisible = () => !document.hidden && send('beat', sid, pathname)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [pathname])

  return null
}

/** Colocado no admin: marca este navegador como "interno" para não inflacionar as métricas. */
export function ExcludeFromAnalytics() {
  useEffect(() => {
    try {
      localStorage.setItem(OPT_OUT_KEY, '1')
    } catch {
      // sem localStorage não é possível excluir; sem drama
    }
  }, [])
  return null
}
