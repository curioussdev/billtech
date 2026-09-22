'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'

/**
 * Ecrã de arranque com a marca, sobreposto ao HTML que o servidor já enviou — não atrasa o LCP, é só
 * uma transição visual por cima de conteúdo que já existe. Desaparece assim que o React hidrata: numa
 * página estática e rápida (o caso da landing) isto dura um instante, e é o resultado desejado, não um
 * defeito — segurar o ecrã propositadamente mais tempo prejudicaria a perceção de velocidade, o oposto
 * do que a Fase 2 pede. Em ligações lentas, o fade-out simplesmente demora mais a aparecer.
 */
export function PreLoader() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(false))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          aria-hidden
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="fixed inset-0 z-[100] grid place-items-center bg-background"
        >
          <m.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative flex size-14 items-center justify-center"
          >
            <span className="absolute inset-0 animate-ping rounded-2xl bg-primary/25" />
            {/* eslint-disable-next-line @next/next/no-img-element -- marca estática de 1KB nos assets locais; não precisa do pipeline de otimização de imagens remotas */}
            <img src="/icon.svg" alt="" width={56} height={56} className="relative rounded-2xl" />
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
