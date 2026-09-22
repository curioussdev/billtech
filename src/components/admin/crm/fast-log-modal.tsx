'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useActionState } from 'react'
import { Check, ChevronsUpDown, Phone } from 'lucide-react'
import { logInteraction, type LogInteractionState } from '@/actions/interactions'
import { useToast } from '@/components/admin/crm/toast'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { interactionOutcomeLabels, interactionTypeLabels } from '@/lib/crm/labels'
import { cn } from '@/lib/utils'
import { INTERACTION_OUTCOMES, INTERACTION_TYPES } from '@/types/crm'
import { OPEN_STAGES } from '@/lib/admin/business'
import type { Lead } from '@/types/lead'

export type FastLogLead = Pick<Lead, 'id' | 'company' | 'stage'>

const initial: LogInteractionState = { status: 'idle' }

function LeadPicker({ leads, value, onChange }: { leads: FastLogLead[]; value: FastLogLead | null; onChange: (lead: FastLogLead) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const sorted = useMemo(() => {
    const open_ = leads.filter((l) => OPEN_STAGES.includes(l.stage))
    const closed = leads.filter((l) => !OPEN_STAGES.includes(l.stage))
    return [...open_, ...closed]
  }, [leads])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? sorted.filter((l) => l.company.toLowerCase().includes(q)) : sorted
  }, [sorted, query])

  return (
    <div className="relative">
      <Label htmlFor="fast-log-lead">Lead</Label>
      <button
        id="fast-log-lead"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="mt-1.5 flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-left text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none"
      >
        <span className={cn(!value && 'text-muted-foreground')}>{value?.company ?? 'Escolher lead…'}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar empresa…" aria-label="Pesquisar lead" className="rounded-none border-0 border-b border-border" />
          <ul role="listbox" aria-label="Leads" className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">Nenhum lead encontrado.</li>}
            {filtered.map((lead) => (
              <li key={lead.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value?.id === lead.id}
                  onClick={() => {
                    onChange(lead)
                    setOpen(false)
                    setQuery('')
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  {lead.company}
                  {value?.id === lead.id && <Check className="size-4 text-primary" aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function FastLogForm({ leads, onClose }: { leads: FastLogLead[]; onClose: () => void }) {
  const [state, action, pending] = useActionState(logInteraction, initial)
  const [lead, setLead] = useState<FastLogLead | null>(null)
  const { push } = useToast()

  useEffect(() => {
    if (state.status === 'success') {
      push(state.message ?? 'Interação registada.', 'success')
      onClose()
    } else if (state.status === 'error' && state.message) {
      push(state.message, 'error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage a novas submissões (identidade do state muda a cada action)
  }, [state])

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="leadId" value={lead?.id ?? ''} />
      <input type="hidden" name="leadLabel" value={lead?.company ?? ''} />

      <LeadPicker leads={leads} value={lead} onChange={setLead} />

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Tipo de interação</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {INTERACTION_TYPES.map((type, i) => (
            <label key={type} className="flex cursor-pointer items-center justify-center rounded-lg border border-border px-2 py-2 text-center text-sm has-checked:border-primary has-checked:bg-primary/10 has-checked:font-semibold has-focus-visible:ring-3 has-focus-visible:ring-ring/70">
              <input type="radio" name="type" value={type} defaultChecked={i === 0} className="sr-only" />
              {interactionTypeLabels[type]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Resultado</legend>
        <div className="grid grid-cols-2 gap-2">
          {INTERACTION_OUTCOMES.map((outcome) => (
            <label key={outcome} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/10 has-focus-visible:ring-3 has-focus-visible:ring-ring/70">
              <input type="radio" name="outcome" value={outcome} className="size-4 accent-[var(--primary)]" required />
              {interactionOutcomeLabels[outcome]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-1.5">
        <Label htmlFor="fast-log-next">Próximo passo</Label>
        <Input id="fast-log-next" name="nextStep" maxLength={200} placeholder="Ex.: Ligar amanhã às 10h" className="h-11 text-base" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="fast-log-notes">Notas (opcional)</Label>
        <Textarea id="fast-log-notes" name="notes" rows={2} maxLength={1000} className="text-base" />
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending || !lead} className="h-11 rounded-xl px-6">
          {pending ? 'A guardar…' : 'Registar'}
        </Button>
      </DialogFooter>
    </form>
  )
}

/**
 * Fast-Log: regista uma interação em menos de 10 segundos. Abre com o FAB (canto inferior direito,
 * visível em toda a área de admin) ou com Cmd/Ctrl+K a partir de qualquer página.
 */
export function FastLogModal({ leads }: { leads: FastLogLead[] }) {
  const [open, setOpen] = useState(false)
  const openedByKeyRef = useRef(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        openedByKeyRef.current = true
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Registar interação rápida (Cmd+K)"
        title="Registar interação rápida (Cmd+K)"
        className="fixed bottom-6 right-6 z-40 size-14 rounded-full p-0 shadow-lg shadow-primary/30 hover:shadow-xl"
      >
        <Phone className="size-5" aria-hidden />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registo rápido</DialogTitle>
            <DialogDescription>Cold call, WhatsApp, reunião, email ou follow-up — em segundos.</DialogDescription>
          </DialogHeader>
          {open && <FastLogForm leads={leads} onClose={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
