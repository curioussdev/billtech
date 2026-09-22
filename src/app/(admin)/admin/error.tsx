'use client'

import { useEffect } from 'react'
import { LayoutDashboard, RotateCcw, ServerCrash } from 'lucide-react'
import { ErrorScene } from '@/components/error-scene'

export default function AdminErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[erro no admin]', error)
  }, [error])

  return (
    <ErrorScene
      compact
      icon={<ServerCrash aria-hidden />}
      title="Esta secção falhou"
      description="Já ficou registado. O resto do painel continua a funcionar normalmente."
      primary={{ label: 'Tentar novamente', onClick: reset, icon: <RotateCcw data-icon="inline-start" aria-hidden /> }}
      secondary={{ label: 'Dashboard', href: '/admin', icon: <LayoutDashboard data-icon="inline-start" aria-hidden /> }}
    />
  )
}
