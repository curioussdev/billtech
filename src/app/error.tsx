'use client'

import { useEffect } from 'react'
import { Home, RotateCcw, ServerCrash } from 'lucide-react'
import { ErrorScene } from '@/components/error-scene'

export default function GlobalErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[erro não tratado]', error)
  }, [error])

  return (
    <ErrorScene
      icon={<ServerCrash aria-hidden />}
      title="Qualquer coisa correu mal"
      description="Já ficou registado do nosso lado. Pode tentar outra vez, ou voltar ao início — os seus dados estão a salvo."
      primary={{ label: 'Tentar novamente', onClick: reset, icon: <RotateCcw data-icon="inline-start" aria-hidden /> }}
      secondary={{ label: 'Voltar ao início', href: '/', icon: <Home data-icon="inline-start" aria-hidden /> }}
    />
  )
}
