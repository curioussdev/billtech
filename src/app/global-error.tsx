'use client'

import { useEffect } from 'react'

/**
 * Último recurso: só entra em ação se o próprio layout raiz (`app/layout.tsx`) falhar — algo bem mais
 * raro do que um erro normal de página (esse é o `app/error.tsx`, animado). Como isto substitui a
 * app inteira, incluindo o `ThemeProvider`/`MotionProvider`, fica deliberadamente sem Tailwind, sem
 * framer-motion e sem os tokens de cor do tema — só HTML e estilo em linha, para nunca depender de
 * nada que possa ter sido a causa da falha.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[erro fatal no layout raiz]', error)
  }, [error])

  return (
    <html lang="pt-PT">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0e1219', color: '#fafaf7', minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: 420, textAlign: 'center', display: 'grid', gap: '1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>A aplicação encontrou um erro grave</h1>
          <p style={{ color: '#b4bcc8', margin: 0 }}>Já ficou registado. Tente recarregar a página — se persistir, contacte-nos.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: '0.5rem', height: 44, padding: '0 1.5rem', borderRadius: 999, border: 'none', background: '#5fd3d0', color: '#0e1219', fontWeight: 700, cursor: 'pointer' }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
