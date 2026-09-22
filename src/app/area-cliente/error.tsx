'use client'

import { useEffect } from 'react'
import { LayoutDashboard, RotateCcw, ServerCrash } from 'lucide-react'
import { ErrorScene } from '@/components/error-scene'

export default function PortalErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[erro na área de cliente]', error)
  }, [error])

  return (
    <ErrorScene
      compact
      icon={<ServerCrash aria-hidden />}
      title="Algo correu mal"
      description="Já ficou registado do nosso lado. Os seus dados estão a salvo — tente outra vez."
      primary={{ label: 'Tentar novamente', onClick: reset, icon: <RotateCcw data-icon="inline-start" aria-hidden /> }}
      secondary={{ label: 'Visão geral', href: '/area-cliente', icon: <LayoutDashboard data-icon="inline-start" aria-hidden /> }}
    />
  )
}
