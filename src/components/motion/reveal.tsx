'use client'

import { m } from 'framer-motion'
import { cn } from '@/lib/utils'

type RevealProps = {
  children: React.ReactNode
  className?: string
  /** Atraso em segundos (útil para escalonar itens de uma grelha) */
  delay?: number
  /** Deslocamento vertical inicial em px; 0 = apenas fade */
  y?: number
}

/** Fade-in + slide-up ao entrar no viewport. Corre uma única vez. */
export function Reveal({ children, className, delay = 0, y = 24 }: RevealProps) {
  return (
    <m.div
      className={cn(className)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </m.div>
  )
}
