'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie } from 'lucide-react'
import { m } from 'framer-motion'
import { CONSENT_EVENT, CONSENT_KEY, OPT_OUT_KEY } from '@/components/analytics-tracker'
import { Button } from '@/components/ui/button'

/** Reabre o banner (usado pelo link "Gerir cookies" no rodapé, para mudar de ideias mais tarde). */
const REOPEN_EVENT = 'bt-open-cookie-prefs'

function readConsent(): 'accepted' | 'rejected' | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY)
    return v === 'accepted' || v === 'rejected' ? v : null
  } catch {
    return null
  }
}

/**
 * Banner de cookies discreto, mas real: enquanto não há decisão, a analítica própria (ver
 * `analytics-tracker.tsx`) não regista nada. Aceitar liga-a já, sem esperar por uma navegação;
 * recusar marca este navegador como excluído (o mesmo mecanismo já usado para o próprio admin).
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (readConsent() === null) setVisible(true)
    const onReopen = () => setVisible(true)
    window.addEventListener(REOPEN_EVENT, onReopen)
    return () => window.removeEventListener(REOPEN_EVENT, onReopen)
  }, [])

  function decide(accepted: boolean) {
    try {
      localStorage.setItem(CONSENT_KEY, accepted ? 'accepted' : 'rejected')
      if (accepted) localStorage.removeItem(OPT_OUT_KEY)
      else localStorage.setItem(OPT_OUT_KEY, '1')
    } catch {
      // sem localStorage: a escolha vale só para esta visita, não persiste
    }
    setVisible(false)
    window.dispatchEvent(new Event(CONSENT_EVENT))
  }

  if (!visible) return null

  return (
    <m.div
      role="region"
      aria-label="Preferências de cookies"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl border border-border bg-card p-5 shadow-2xl sm:inset-x-auto sm:right-6 sm:left-auto"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Cookie className="size-5" aria-hidden />
        </span>
        <p className="min-w-0 text-sm leading-6 text-muted-foreground">
          Este site não usa cookies de publicidade nem de terceiros. Usamos apenas uma analítica própria, sem cookies, para saber quantas
          pessoas nos visitam — e só com a sua autorização.{' '}
          <Link href="/cookies" className="font-medium text-foreground underline-offset-4 hover:underline">
            Saber mais
          </Link>
          .
        </p>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => decide(false)}>
          Só o essencial
        </Button>
        <Button type="button" size="sm" onClick={() => decide(true)}>
          Aceitar
        </Button>
      </div>
    </m.div>
  )
}

/** Link no rodapé para reabrir o banner e mudar de ideias, sem precisar de limpar dados do navegador. */
export function ManageCookiesLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(REOPEN_EVENT))} className={className}>
      Gerir cookies
    </button>
  )
}
