'use client'

import { useActionState, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { login, register, type AuthState } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initial: AuthState = { status: 'idle' }

function Field({ id, label, error, ...props }: React.ComponentProps<typeof Input> & { id: string; label: string; error?: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} className="h-11 text-base" aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function Feedback({ state }: { state: AuthState }) {
  return (
    <>
      <div role="status" aria-live="polite">
        {state.status === 'success' && <p className="text-sm font-medium text-primary">{state.message}</p>}
      </div>
      <div role="alert">{state.status === 'error' && state.message && <p className="text-sm font-medium text-destructive">{state.message}</p>}</div>
    </>
  )
}

function LoginForm() {
  const [state, action, pending] = useActionState(login, initial)
  return (
    <form action={action} className="grid gap-5">
      <Field id="email" label="Email" type="email" required autoComplete="email" defaultValue={state.values?.email} error={state.fieldErrors?.email} />
      <Field id="password" label="Palavra-passe" type="password" required autoComplete="current-password" error={state.fieldErrors?.password} />
      <Button type="submit" disabled={pending} className="h-12 rounded-xl text-base">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null} Entrar
      </Button>
      <Feedback state={state} />
    </form>
  )
}

function RegisterForm() {
  const [state, action, pending] = useActionState(register, initial)
  return (
    <form action={action} className="grid gap-5">
      <Field id="fullName" label="Nome" required autoComplete="name" defaultValue={state.values?.fullName} error={state.fieldErrors?.fullName} />
      <Field id="company" label="Empresa (opcional)" autoComplete="organization" defaultValue={state.values?.company} error={state.fieldErrors?.company} />
      <Field id="email" label="Email" type="email" required autoComplete="email" defaultValue={state.values?.email} error={state.fieldErrors?.email} />
      <Field id="password" label="Palavra-passe (mín. 8 caracteres)" type="password" required minLength={8} autoComplete="new-password" error={state.fieldErrors?.password} />
      <Button type="submit" disabled={pending} className="h-12 rounded-xl text-base">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null} Criar conta de cliente
      </Button>
      <Feedback state={state} />
    </form>
  )
}

export function AuthForms() {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div>
      <div role="group" aria-label="Escolher entre entrar e criar conta" className="mb-8 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(
          [
            ['login', 'Entrar'],
            ['register', 'Criar conta'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
          >
            {label}
          </button>
        ))}
      </div>
      {mode === 'login' ? <LoginForm /> : <RegisterForm />}
    </div>
  )
}
