'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Megaphone, Plus, Trash2 } from 'lucide-react'
import { createCampaign, deleteCampaign } from '@/actions/marketing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatEUR, formatInt, formatPct } from '@/lib/admin/format'
import { campaignPlatformLabels, campaignStatusLabels } from '@/lib/marketing/labels'
import type { MarketingCampaignRow } from '@/lib/marketing/overview'
import { CAMPAIGN_PLATFORMS, CAMPAIGN_STATUSES } from '@/types/marketing'

const inputClass = 'h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'

function CreateCampaignForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState<(typeof CAMPAIGN_PLATFORMS)[number]>('meta')
  const [status, setStatus] = useState<(typeof CAMPAIGN_STATUSES)[number]>('ativa')
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [endedAt, setEndedAt] = useState('')
  const [notes, setNotes] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await createCampaign({ name, platform, status, startedAt, endedAt: endedAt || undefined, notes })
    setPending(false)
    if (!result.ok) return setError(result.message)
    setName('')
    setEndedAt('')
    setNotes('')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-dashed border-border p-4 sm:grid-cols-2 lg:grid-cols-6">
      <div className="grid gap-1 lg:col-span-2">
        <Label htmlFor="camp-name" className="text-xs">Nome</Label>
        <Input id="camp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Meta Ads — Oficinas Lisboa" required minLength={3} className={inputClass} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="camp-platform" className="text-xs">Plataforma</Label>
        <select id="camp-platform" value={platform} onChange={(e) => setPlatform(e.target.value as typeof platform)} className={inputClass}>
          {CAMPAIGN_PLATFORMS.map((p) => (
            <option key={p} value={p}>{campaignPlatformLabels[p]}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-1">
        <Label htmlFor="camp-status" className="text-xs">Estado</Label>
        <select id="camp-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={inputClass}>
          {CAMPAIGN_STATUSES.map((s) => (
            <option key={s} value={s}>{campaignStatusLabels[s]}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-1">
        <Label htmlFor="camp-start" className="text-xs">Início</Label>
        <Input id="camp-start" type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} required className={inputClass} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="camp-end" className="text-xs">Fim (opcional)</Label>
        <Input id="camp-end" type="date" value={endedAt} onChange={(e) => setEndedAt(e.target.value)} className={inputClass} />
      </div>
      <div className="grid gap-1 sm:col-span-2 lg:col-span-6">
        <Label htmlFor="camp-notes" className="text-xs">Notas (opcional)</Label>
        <Input id="camp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Segmentação, público-alvo, observações…" maxLength={500} className={inputClass} />
      </div>
      <div className="flex items-end lg:col-span-6">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />} Criar campanha
        </Button>
      </div>
      {error && <p role="alert" className="text-sm font-medium text-destructive sm:col-span-2 lg:col-span-6">{error}</p>}
    </form>
  )
}

function DeleteCampaignButton({ id, name }: { id: string; name: string }) {
  const [pending, setPending] = useState(false)
  async function action(formData: FormData) {
    if (!window.confirm(`Remover a campanha "${name}"? As métricas diárias associadas também são apagadas. Os leads já atribuídos ficam sem campanha, não são apagados.`)) return
    setPending(true)
    await deleteCampaign(formData)
    setPending(false)
  }
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="icon-sm" disabled={pending} aria-label={`Remover ${name}`}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4 text-muted-foreground" aria-hidden />}
      </Button>
    </form>
  )
}

export function CampaignsSection({ campaigns }: { campaigns: MarketingCampaignRow[] }) {
  return (
    <div className="grid gap-4">
      <CreateCampaignForm />
      {campaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ainda sem campanhas registadas.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">Campanhas de marketing pago e os seus números no período selecionado</caption>
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">Campanha</th>
                <th scope="col" className="px-4 py-3">Plataforma</th>
                <th scope="col" className="px-4 py-3 text-right">Gasto</th>
                <th scope="col" className="px-4 py-3 text-right">CTR</th>
                <th scope="col" className="px-4 py-3 text-right">Leads</th>
                <th scope="col" className="px-4 py-3 text-right">CPL</th>
                <th scope="col" className="px-4 py-3 text-right">ROAS</th>
                <th scope="col" className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium">
                      <Megaphone className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      {c.name}
                    </span>
                    <span className="block pl-6 text-xs text-muted-foreground">{campaignStatusLabels[c.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{campaignPlatformLabels[c.platform]}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatEUR(c.spend)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatPct(c.ctrPct)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatInt(c.leadsCount)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatEUR(c.cpl)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.roas === null ? '—' : `${(Math.round(c.roas * 10) / 10).toLocaleString('pt-PT')}×`}</td>
                  <td className="px-4 py-3 text-right"><DeleteCampaignButton id={c.id} name={c.name} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
