'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createClientAccount } from '@/actions/clients'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Mostrado depois de a conta ser criada com sucesso — confirma que o convite foi enviado antes de fechar. */
function InviteSent({ email, onDone }: { email: string; onDone: () => void }) {
  return (
    <div className="grid gap-4">
      <p role="alert" className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-200">
        <strong>Conta criada.</strong> Enviámos um email para {email} com um link para o cliente definir a própria password.
      </p>
      <DialogFooter>
        <Button type="button" onClick={onDone}>
          Concluído
        </Button>
      </DialogFooter>
    </div>
  )
}

/** Botão + modal para o admin dar acesso ao portal a um cliente fechado offline, sem passar pelo autorregisto público. */
export function NewClientModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdEmail, setCreatedEmail] = useState<string | null>(null)

  function reset() {
    setFullName('')
    setEmail('')
    setCompany('')
    setError(null)
    setCreatedEmail(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await createClientAccount({ email, fullName, company: company.trim() || undefined })
    setPending(false)
    if (!result.ok) return setError(result.message)
    setCreatedEmail(email)
  }

  function close() {
    setOpen(false)
    reset()
    router.refresh()
  }

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden /> Novo cliente
      </Button>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{createdEmail ? 'Convite enviado' : 'Novo cliente'}</DialogTitle>
            <DialogDescription>
              {createdEmail ? 'A conta já está disponível em «Clientes».' : 'Dá acesso imediato ao portal a um cliente fechado offline — sem passar pelo autorregisto público.'}
            </DialogDescription>
          </DialogHeader>

          {createdEmail ? (
            <InviteSent email={createdEmail} onDone={close} />
          ) : (
            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="new-client-name">Nome completo</Label>
                <Input id="new-client-name" required maxLength={160} value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 text-base" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="new-client-email">Email</Label>
                <Input id="new-client-email" type="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 text-base" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="new-client-company">Empresa (opcional)</Label>
                <Input id="new-client-company" maxLength={160} value={company} onChange={(e) => setCompany(e.target.value)} className="h-11 text-base" />
              </div>
              {error && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={close}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending || !fullName.trim() || !email.trim()} className="h-11 rounded-xl px-6">
                  {pending ? 'A criar…' : 'Criar conta'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
