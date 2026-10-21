'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { logCampaignMetrics } from '@/actions/marketing'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Campaign } from '@/types/marketing'

const inputClass = 'h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'

/** Registo diário manual: números brutos de uma campanha num dia — upsert, corrige se já existir para essa data. */
export function MetricsEntryForm({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter()
  const [campaignId, setCampaignId] = useState<string | null>(campaigns[0]?.id ?? null)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [impressions, setImpressions] = useState('')
  const [clicks, setClicks] = useState('')
  const [spend, setSpend] = useState('')
  const [leadsCount, setLeadsCount] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!campaignId) return setError('Escolha uma campanha.')
    setPending(true)
    setError(null)
    setSuccess(false)
    const result = await logCampaignMetrics({ campaignId, date, impressions, clicks, spend, leadsCount })
    setPending(false)
    if (!result.ok) return setError(result.message)
    setSuccess(true)
    setImpressions('')
    setClicks('')
    setSpend('')
    setLeadsCount('')
    router.refresh()
  }

  if (campaigns.length === 0) return <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">Crie uma campanha acima antes de registar métricas diárias.</p>

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-dashed border-border p-4 sm:grid-cols-2 lg:grid-cols-6">
      <div className="grid gap-1 lg:col-span-2">
        <Label htmlFor="metrics-campaign" className="text-xs">Campanha</Label>
        <SearchableSelect id="metrics-campaign" items={campaigns.map((c) => ({ value: c.id, label: c.name }))} value={campaignId} onValueChange={setCampaignId} placeholder="Escolher campanha…" emptyMessage="Nenhuma campanha encontrada." className="h-9 text-sm" />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="metrics-date" className="text-xs">Data</Label>
        <Input id="metrics-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required max={new Date().toISOString().slice(0, 10)} className={inputClass} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="metrics-impressions" className="text-xs">Impressões</Label>
        <Input id="metrics-impressions" type="number" min={0} value={impressions} onChange={(e) => setImpressions(e.target.value)} placeholder="0" required className={inputClass} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="metrics-clicks" className="text-xs">Cliques</Label>
        <Input id="metrics-clicks" type="number" min={0} value={clicks} onChange={(e) => setClicks(e.target.value)} placeholder="0" required className={inputClass} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="metrics-spend" className="text-xs">Gasto (€)</Label>
        <Input id="metrics-spend" type="number" min={0} step="0.01" value={spend} onChange={(e) => setSpend(e.target.value)} placeholder="0,00" required className={inputClass} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="metrics-leads" className="text-xs">Leads (plataforma)</Label>
        <Input id="metrics-leads" type="number" min={0} value={leadsCount} onChange={(e) => setLeadsCount(e.target.value)} placeholder="0" required className={inputClass} />
      </div>
      <div className="flex items-end lg:col-span-6">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />} Registar métricas do dia
        </Button>
        {success && <span role="status" className="ml-3 self-center text-xs font-medium text-primary">Guardado.</span>}
      </div>
      {error && <p role="alert" className="text-sm font-medium text-destructive sm:col-span-2 lg:col-span-6">{error}</p>}
    </form>
  )
}
