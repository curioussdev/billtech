'use client'

import { domAnimation, LazyMotion, MotionConfig } from 'framer-motion'

/**
 * Carrega apenas as features de animação DOM (bundle menor) e respeita
 * `prefers-reduced-motion` em todas as animações da app.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
