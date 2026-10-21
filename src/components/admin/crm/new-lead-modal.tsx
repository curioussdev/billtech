'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createLead } from '@/actions/leads'
import { CurrencyInput } from '@/components/shared/currency-input'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/ui/combobox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { leadChannelLabels, sectorLabels } from '@/lib/admin/format'
import { LEAD_CHANNELS, type LeadChannel } from '@/types/lead'
import type { Campaign } from '@/types/marketing'
import { SECTORS, type Sector } from '@/types/project'

const selectClass = 'h-11 rounded-lg border border-input bg-background px-3 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'

function NewLeadForm({ campaigns, onClose }: { campaigns: Campaign[]; onClose: () => void }) {
  const router = useRouter()
  const [company, setCompany] = useState('')
  const [contactName, setContactName] = useState('')
  const [sector, setSector] = useState<Sector>(SECTORS[0])
  const [channel, setChannel] = useState<LeadChannel>(LEAD_CHANNELS[0])
  const [estimatedValue, setEstimatedValue] = useState('')
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const result = await createLead({ company, contactName, sector, channel, estimatedValue: estimatedValue || 0, campaignId: campaignId ?? undefined })
    setPending(false)
    if (!result.ok) return setError(result.message)
    router.refresh()
    onClose()
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="new-lead-company">Nome da empresa</Label>
        <Input id="new-lead-company" required maxLength={160} value={company} onChange={(e) => setCompany(e.target.value)} className="h-11 text-base" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="new-lead-contact">Contacto</Label>
        <Input id="new-lead-contact" required maxLength={160} value={contactName} onChange={(e) => setContactName(e.target.value)} className="h-11 text-base" placeholder="Nome da pessoa de contacto" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="new-lead-sector">Nicho</Label>
        <select id="new-lead-sector" value={sector} onChange={(e) => setSector(e.target.value as Sector)} className={selectClass}>
          {SECTORS.map((s) => (
            <option key={s} value={s}>
              {sectorLabels[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="new-lead-channel">Origem</Label>
        <select id="new-lead-channel" value={channel} onChange={(e) => setChannel(e.target.value as LeadChannel)} className={selectClass}>
          {LEAD_CHANNELS.map((c) => (
            <option key={c} value={c}>
              {leadChannelLabels[c]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="new-lead-value">Valor estimado (opcional)</Label>
        <CurrencyInput id="new-lead-value" value={estimatedValue} onChange={setEstimatedValue} placeholder="0" />
      </div>
      {campaigns.length > 0 && (
        <div className="grid gap-1.5">
          <Label htmlFor="new-lead-campaign">Campanha de origem (opcional)</Label>
          <SearchableSelect id="new-lead-campaign" items={campaigns.map((c) => ({ value: c.id, label: c.name }))} value={campaignId} onValueChange={setCampaignId} placeholder="Sem campanha associada" emptyMessage="Nenhuma campanha encontrada." className="h-11 text-base" />
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending || !company.trim() || !contactName.trim()} className="h-11 rounded-xl px-6">
          {pending ? 'A criar…' : 'Criar lead'}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Botão + modal para registar um lead manualmente (prospeção ativa, indicação) sem passar pelo formulário da landing. */
export function NewLeadModal({ campaigns = [] }: { campaigns?: Campaign[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden />
        Novo lead
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo lead</DialogTitle>
            <DialogDescription>Para prospeção ativa, indicações ou contactos que não vieram da landing page.</DialogDescription>
          </DialogHeader>
          {open && <NewLeadForm campaigns={campaigns} onClose={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
