'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastTone = 'success' | 'error'
type ToastItem = { id: number; message: string; tone: ToastTone }
type ToastContextValue = { push: (message: string, tone?: ToastTone) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

/**
 * Toast leve e local (sem dependência nova): o Fast-Log Modal e o Deal Board fecham antes de mostrar
 * o resultado, por isso a mensagem tem de sobreviver ao modal já fechado — daí ser flutuante e não
 * a região `role="status"` inline usada no resto do admin.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((all) => [...all, { id, message, tone }])
    window.setTimeout(() => setToasts((all) => all.filter((t) => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div aria-live="polite" role="region" aria-label="Notificações" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex max-w-sm items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg',
              t.tone === 'success' ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200' : 'border-destructive/40 bg-destructive/10 text-destructive',
            )}
          >
            {t.tone === 'success' ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast tem de ser usado dentro de <ToastProvider>')
  return ctx
}
