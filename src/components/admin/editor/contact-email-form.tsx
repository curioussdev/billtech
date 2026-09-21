'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { saveContactEmail, type SaveResult } from '@/actions/dashboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ContactEmailForm({ current }: { current: string }) {
  const [state, action, pending] = useActionState<SaveResult | null, FormData>(saveContactEmail, null)

  return (
    <form action={action} className="grid max-w-md gap-3">
      <Label htmlFor="email">Email que recebe as mensagens do formulário</Label>
      <Input id="email" name="email" type="email" required defaultValue={current} className="h-11 text-base" />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending && <Loader2 className="animate-spin" aria-hidden />} Guardar
      </Button>
      <div role="status" aria-live="polite">
        {state && <p className={state.ok ? 'text-sm font-medium text-primary' : 'text-sm font-medium text-destructive'}>{state.message}</p>}
      </div>
    </form>
  )
}
