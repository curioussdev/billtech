'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Plus } from 'lucide-react'
import { createExternalSite } from '@/actions/external-sites'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const selectClass = 'h-11 rounded-lg border border-input bg-background px-3 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'

function ApiKeyReveal({ apiKey, onDone }: { apiKey: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
    } catch {
      /* clipboard indisponível — o admin copia manualmente */
    }
  }

  return (
    <div className="grid gap-4">
      <p role="alert" className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
        <strong>Guarde esta chave agora.</strong> Não volta a ser mostrada — só fica guardado o hash. Coloque-a nas variáveis de ambiente do site do cliente.
      </p>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm">{apiKey}</code>
        <Button type="button" variant="outline" size="icon-sm" onClick={copy} aria-label="Copiar chave">
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        </Button>
      </div>
      <DialogFooter>
        <Button type="button" onClick={onDone}>
          Concluído
        </Button>
      </DialogFooter>
    </div>
  )
}

export function NewSiteModal({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [clientId, setClientId] = useState('')
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)

  function reset() {
    setClientId('')
    setName('')
    setDomain('')
    setError(null)
    setGeneratedKey(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await createExternalSite({ clientId, name, domain })
    setPending(false)
    if (!result.ok) return setError(result.message)
    setGeneratedKey(result.apiKey)
  }

  function close() {
    setOpen(false)
    reset()
    router.refresh()
  }

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden /> Novo site
      </Button>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{generatedKey ? 'Site registado' : 'Novo site externo'}</DialogTitle>
            <DialogDescription>{generatedKey ? 'Chave de API gerada.' : 'Associe o site de um cliente para começar a receber telemetria.'}</DialogDescription>
          </DialogHeader>

          {generatedKey ? (
            <ApiKeyReveal apiKey={generatedKey} onDone={close} />
          ) : (
            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="site-client">Cliente</Label>
                <select id="site-client" value={clientId} onChange={(e) => setClientId(e.target.value)} required className={selectClass}>
                  <option value="" disabled>
                    Escolher cliente…
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="site-name">Nome do site</Label>
                <Input id="site-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} className="h-11 text-base" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="site-domain">Domínio</Label>
                <Input id="site-domain" value={domain} onChange={(e) => setDomain(e.target.value)} required maxLength={200} placeholder="cliente.exemplo.pt" className="h-11 text-base" />
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
                <Button type="submit" disabled={pending || !clientId} className="h-11 rounded-xl px-6">
                  {pending ? 'A gerar chave…' : 'Registar e gerar chave'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
