'use client'

import { useActionState } from 'react'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { submitContact } from '@/actions/contact'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ContactField, ContactState } from '@/lib/validations/contact'

const initialState: ContactState = { status: 'idle' }

export function ContactForm({ submitLabel = 'Agendar Reunião' }: { submitLabel?: string }) {
  const [state, formAction, pending] = useActionState(submitContact, initialState)
  const errors = state.fieldErrors ?? {}

  const fieldProps = (name: ContactField) => ({
    id: name,
    name,
    defaultValue: state.values?.[name] ?? '',
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  })

  const fieldError = (name: ContactField) =>
    errors[name] ? (
      <p id={`${name}-error`} className="text-sm font-medium text-destructive">
        {errors[name]}
      </p>
    ) : null

  return (
    <form action={formAction} className="grid gap-5 rounded-3xl bg-card p-6 text-card-foreground shadow-xl sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input {...fieldProps('name')} required autoComplete="name" placeholder="O seu nome" className="h-11 text-base" />
          {fieldError("name")}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email da Empresa</Label>
          <Input {...fieldProps('email')} type="email" required autoComplete="email" placeholder="nome@empresa.pt" className="h-11 text-base" />
          {fieldError("email")}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="whatsapp">
          WhatsApp <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Input {...fieldProps('whatsapp')} type="tel" autoComplete="tel" placeholder="+351 000 000 000" className="h-11 text-base" />
        {fieldError("whatsapp")}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="challenge">Qual o seu maior desafio hoje?</Label>
        <Textarea {...fieldProps('challenge')} required minLength={10} maxLength={2000} placeholder="Conte-nos brevemente sobre a sua operação..." className="min-h-28 resize-none text-base" />
        {fieldError("challenge")}
      </div>

      {/* Honeypot anti-spam: escondido de utilizadores e de leitores de ecrã */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Não preencher</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Button type="submit" disabled={pending} className="h-12 rounded-xl text-base">
        {pending ? (
          <>
            <Loader2 className="animate-spin" aria-hidden /> A enviar…
          </>
        ) : (
          <>
            {submitLabel} <ArrowRight data-icon="inline-end" aria-hidden />
          </>
        )}
      </Button>

      {/* Região viva sempre presente para que leitores de ecrã anunciem o resultado */}
      <div role="status" aria-live="polite">
        {state.status === 'success' && (
          <p className="flex items-start gap-2 text-sm font-medium text-primary">
            <CheckCircle2 className="mt-0.5 shrink-0" aria-hidden /> {state.message}
          </p>
        )}
      </div>
      <div role="alert">{state.status === 'error' && <p className="text-sm font-medium text-destructive">{state.message}</p>}</div>
    </form>
  )
}
