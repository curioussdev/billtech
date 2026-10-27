'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Repeat, ShieldCheck, Trash2 } from 'lucide-react'
import { createAutopaySetupSession, revokeAutopayMandate, setInvoiceAutopay } from '@/actions/autopay'
import { Button } from '@/components/ui/button'

/** Leva o cliente ao Checkout da Stripe em modo "configuração" — escolhe cartão ou IBAN, nada é cobrado aqui. */
export function SetupAutopayButton() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mock, setMock] = useState(false)

  async function start() {
    setPending(true)
    setError(null)
    const result = await createAutopaySetupSession({ idempotencyKey: crypto.randomUUID() })
    setPending(false)
    if (!result.ok) return setError(result.message)
    if (result.mock) return setMock(true)
    if (result.url) window.location.href = result.url
  }

  return (
    <div className="grid gap-2">
      <Button type="button" onClick={start} disabled={pending} className="w-fit rounded-xl">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <ShieldCheck aria-hidden />} Configurar débito automático
      </Button>
      {mock && <p role="status" className="text-sm text-muted-foreground">O débito automático ainda não está disponível. Contacte-nos para combinar o pagamento.</p>}
      {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  )
}

/** Remove o método guardado — desliga-o a sério na Stripe, não só visualmente. */
export function RevokeAutopayButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function revoke() {
    if (!window.confirm('Remover o método de débito automático? As faturas com cobrança automática ativa deixam de ser cobradas sozinhas.')) return
    setPending(true)
    setError(null)
    const result = await revokeAutopayMandate()
    setPending(false)
    if (!result.ok) return setError(result.message)
    router.refresh()
  }

  return (
    <div className="grid gap-2">
      <Button type="button" variant="outline" onClick={revoke} disabled={pending} className="w-fit rounded-xl">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />} Remover
      </Button>
      {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  )
}

/** Liga/desliga a cobrança automática para uma fatura — só aparece quando o cliente já tem um método guardado. */
export function AutopayToggle({ invoiceId, enabled }: { invoiceId: string; enabled: boolean }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    setPending(true)
    setError(null)
    const result = await setInvoiceAutopay({ invoiceId, enabled: !enabled })
    setPending(false)
    if (!result.ok) return setError(result.message)
    router.refresh()
  }

  return (
    <div className="grid gap-1">
      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={toggle} disabled={pending} className="size-4 accent-[var(--primary)]" />
        <span className="flex items-center gap-1.5">
          <Repeat className="size-3.5 text-muted-foreground" aria-hidden />
          Cobrar automaticamente esta fatura
        </span>
        {pending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden />}
      </label>
      {error && <p role="alert" className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}
