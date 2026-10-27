'use client'

import { useState } from 'react'
import { Check, CheckCircle2, Copy, Landmark, Link2, Loader2, Repeat } from 'lucide-react'
import { createAutopaySetupSessionForClient, createSepaMandateWithIban, sendAutopaySetupEmail } from '@/actions/autopay'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/ui/combobox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type Client = { id: string; name: string }
type Mode = 'link' | 'iban'

const inputClass = 'h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'

/** Revela o link gerado — o cliente escreve o cartão/IBAN só na página da própria Stripe, nunca aqui. */
function LinkReveal({ clientId, url, onDone }: { clientId: string; url: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      /* clipboard indisponível — o admin copia manualmente */
    }
  }

  async function send() {
    setSending(true)
    setError(null)
    const result = await sendAutopaySetupEmail({ clientId, url })
    setSending(false)
    if (!result.ok) return setError(result.message)
    setSent(true)
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">Link de uso limitado. O cliente escreve o cartão ou o IBAN só na página segura da Stripe — nunca passa por nós.</p>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs">{url}</code>
        <Button type="button" variant="outline" size="icon-sm" onClick={copy} aria-label="Copiar link">
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        </Button>
      </div>
      {sent ? (
        <p role="status" className="text-sm font-medium text-primary">
          Email enviado ao cliente.
        </p>
      ) : (
        <Button type="button" onClick={send} disabled={sending} className="w-fit rounded-xl">
          {sending ? <Loader2 className="animate-spin" aria-hidden /> : null} Enviar por email ao cliente
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="button" onClick={onDone}>
          Concluído
        </Button>
      </DialogFooter>
    </div>
  )
}

/**
 * Admin escreve o IBAN diretamente — seguro porque IBAN não é dado PCI (isso só se aplica a cartão) e
 * a Stripe suporta mandatos "offline" (autorização recolhida por telefone/papel, não pela própria
 * página dela) precisamente para este caso. A nota de autorização é obrigatória: fica a prova de como
 * o cliente autorizou, já que não foi ele a escrever isto na Stripe.
 */
function IbanForm({ clientId, onDone }: { clientId: string; onDone: () => void }) {
  const [iban, setIban] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [authorizationNote, setAuthorizationNote] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await createSepaMandateWithIban({ clientId, iban, accountHolderName, authorizationNote })
    setPending(false)
    if (!result.ok) return setError(result.message)
    setDone(true)
  }

  if (done) {
    return (
      <div className="grid gap-4">
        <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          Débito automático por IBAN registado e já ativo.
        </p>
        <DialogFooter>
          <Button type="button" onClick={onDone}>
            Concluído
          </Button>
        </DialogFooter>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="mandate-iban">IBAN do cliente</Label>
        <Input id="mandate-iban" value={iban} onChange={(e) => setIban(e.target.value)} placeholder="PT50 0000 0000 0000 0000 0000 0" required className={inputClass} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="mandate-holder">Nome do titular da conta</Label>
        <Input id="mandate-holder" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} required maxLength={160} className={inputClass} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="mandate-note">Como foi obtida a autorização do cliente</Label>
        <Textarea
          id="mandate-note"
          value={authorizationNote}
          onChange={(e) => setAuthorizationNote(e.target.value)}
          placeholder="Ex.: autorizado por telefone em 14/03, confirmado por email…"
          required
          minLength={5}
          maxLength={300}
          rows={2}
        />
        <p className="text-xs text-muted-foreground">Obrigatório — fica registado na auditoria. É a prova de que o cliente autorizou mesmo, já que não foi ele a escrever o IBAN na Stripe.</p>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="submit" disabled={pending} className="rounded-xl">
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null} Registar débito direto
        </Button>
      </DialogFooter>
    </form>
  )
}

/**
 * O admin ativa débito automático em nome de um cliente, por dois caminhos: gerar o link seguro que o
 * cliente já pode gerar sozinho (cartão ou IBAN, nunca passa pelo nosso servidor), ou escrever o IBAN
 * diretamente (seguro para IBAN especificamente — ver nota de segurança no plano). Cartão nunca é
 * escrito aqui. `defaultClientId` pré-escolhe o cliente (ex.: a partir da ficha dele) e esconde o
 * seletor.
 */
export function RegisterMandateDialog({ clients, defaultClientId, triggerLabel = 'Registar débito automático' }: { clients: Client[]; defaultClientId?: string; triggerLabel?: string }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('link')
  const [clientId, setClientId] = useState<string | null>(defaultClientId ?? null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [mock, setMock] = useState(false)

  function reset() {
    setMode('link')
    setClientId(defaultClientId ?? null)
    setError(null)
    setUrl(null)
    setMock(false)
  }

  async function generateLink() {
    if (!clientId) return setError('Escolha um cliente.')
    setPending(true)
    setError(null)
    const result = await createAutopaySetupSessionForClient({ clientId, idempotencyKey: crypto.randomUUID() })
    setPending(false)
    if (!result.ok) return setError(result.message)
    if (result.mock) return setMock(true)
    if (result.url) setUrl(result.url)
  }

  function close() {
    setOpen(false)
    reset()
  }

  const showingResult = (mode === 'link' && (url || mock)) as boolean

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Repeat className="size-4" aria-hidden /> {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registar débito automático</DialogTitle>
            <DialogDescription>Gere um link seguro para o cliente preencher na Stripe, ou registe o IBAN diretamente — nunca o cartão.</DialogDescription>
          </DialogHeader>

          {!showingResult && !defaultClientId && (
            <SearchableSelect
              items={clients.map((c) => ({ value: c.id, label: c.name }))}
              value={clientId}
              onValueChange={setClientId}
              placeholder="Escolher cliente…"
              emptyMessage="Nenhum cliente encontrado."
              className="h-11 text-base"
            />
          )}

          {!showingResult && (
            <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Forma de registar">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'link'}
                onClick={() => setMode('link')}
                className={cn('flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium', mode === 'link' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted')}
              >
                <Link2 className="size-4" aria-hidden /> Link seguro
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'iban'}
                onClick={() => setMode('iban')}
                className={cn('flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium', mode === 'iban' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted')}
              >
                <Landmark className="size-4" aria-hidden /> Inserir IBAN
              </button>
            </div>
          )}

          {mode === 'iban' ? (
            clientId ? <IbanForm clientId={clientId} onDone={close} /> : <p className="text-sm text-muted-foreground">Escolha um cliente acima.</p>
          ) : url && clientId ? (
            <LinkReveal clientId={clientId} url={url} onDone={close} />
          ) : mock ? (
            <p role="status" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
              O débito automático ainda não está disponível (Stripe não configurada).
            </p>
          ) : (
            <div className="grid gap-4">
              {error && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {error}
                </p>
              )}
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={close}>
                  Cancelar
                </Button>
                <Button type="button" onClick={generateLink} disabled={pending || !clientId} className="rounded-xl">
                  {pending ? <Loader2 className="animate-spin" aria-hidden /> : null} Gerar link
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
