'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, KeyRound } from 'lucide-react'
import { regenerateApiKey } from '@/actions/external-sites'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function RegenerateKeyButton({ siteId }: { siteId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function regenerate() {
    if (!window.confirm('Gerar uma nova chave invalida a anterior de imediato — o site do cliente deixa de conseguir enviar telemetria até atualizar a variável de ambiente. Continuar?')) return
    setPending(true)
    const result = await regenerateApiKey(siteId)
    setPending(false)
    if (!result.ok) return
    setNewKey(result.apiKey)
    setOpen(true)
  }

  async function copy() {
    if (!newKey) return
    try {
      await navigator.clipboard.writeText(newKey)
      setCopied(true)
    } catch {
      /* clipboard indisponível */
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={regenerate} disabled={pending}>
        <KeyRound className="size-4" aria-hidden /> {pending ? 'A gerar…' : 'Gerar nova chave'}
      </Button>
      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : (setOpen(false), setNewKey(null), setCopied(false), router.refresh()))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova chave gerada</DialogTitle>
            <DialogDescription>Guarde-a agora — não volta a ser mostrada.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm">{newKey}</code>
            <Button type="button" variant="outline" size="icon-sm" onClick={copy} aria-label="Copiar chave">
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => (setOpen(false), setNewKey(null), setCopied(false), router.refresh())}>
              Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
