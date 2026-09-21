'use client'

import { useActionState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { sendClientMessage, type ClientMessageState } from '@/actions/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const initial: ClientMessageState = { status: 'idle' }

export function ClientMessageForm() {
  const [state, action, pending] = useActionState(sendClientMessage, initial)

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="message">Como podemos ajudar?</Label>
        <Textarea id="message" name="message" required minLength={10} maxLength={2000} className="min-h-32 text-base" placeholder="Descreva o que precisa: suporte, nova funcionalidade, orçamento…" />
      </div>
      <Button type="submit" disabled={pending} className="h-11 w-fit rounded-xl px-6">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />} Enviar à BillTech
      </Button>
      <div role="status" aria-live="polite">
        {state.status === 'success' && <p className="text-sm font-medium text-primary">{state.message}</p>}
      </div>
      <div role="alert">{state.status === 'error' && <p className="text-sm font-medium text-destructive">{state.message}</p>}</div>
    </form>
  )
}
