'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Status = 'checking' | 'ready' | 'invalid' | 'done'

/**
 * Único sítio da aplicação que define a password — usado para o convite inicial, recuperação e
 * pedido de alteração nas definições. Recebe `tokenHash`/`type` da query da página (nunca o
 * `action_link` direto da Supabase — ver `src/actions/clients.ts`) e só os consome aqui, no
 * cliente, via `verifyOtp`: é a única forma de garantir que foi uma pessoa a abrir a página, e não
 * um scanner de segurança do email a pré-visitar o link antes de o destinatário o ver.
 */
export function SetPasswordForm({ tokenHash, type }: { tokenHash?: string; type: 'recovery' | 'invite' }) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tokenHash) {
      setStatus('invalid')
      return
    }
    const supabase = createClient()
    supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error: verifyError }) => {
      setStatus(verifyError ? 'invalid' : 'ready')
    })
  }, [tokenHash, type])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (password.length < 8) return setError('A password tem de ter pelo menos 8 caracteres.')
    if (password !== confirm) return setError('As duas passwords não coincidem.')

    setPending(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setPending(false)
    if (updateError) return setError('Não foi possível definir a password. Peça um novo link e tente outra vez.')

    setStatus('done')
    setTimeout(() => router.replace('/conta'), 1500)
  }

  if (status === 'checking') {
    return <p className="text-sm text-muted-foreground">A verificar o link…</p>
  }

  if (status === 'invalid') {
    return (
      <div className="grid gap-4">
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
          Este link é inválido ou já expirou.
        </p>
        <p className="text-xs text-muted-foreground">
          Isto pode acontecer se o filtro de segurança do seu email já tiver "aberto" o link por si antes de o ver. Peça um novo a partir de "Esqueceu-se da password?".
        </p>
        <Link href="/entrar" className="text-sm font-medium text-primary hover:underline">
          Voltar a entrar
        </Link>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <p role="status" className="rounded-lg bg-emerald-500/10 p-4 text-sm font-medium text-emerald-800 dark:text-emerald-300">
        Password definida com sucesso. A entrar na sua conta…
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="new-password">Nova password</Label>
        <Input id="new-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 text-base" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm-password">Confirmar password</Label>
        <Input id="confirm-password" type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11 text-base" />
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-11 rounded-xl">
        {pending ? 'A guardar…' : 'Definir password'}
      </Button>
    </form>
  )
}
