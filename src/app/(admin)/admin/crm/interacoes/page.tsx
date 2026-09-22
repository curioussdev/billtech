import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarClock, Mail, MessageCircle, NotebookText, Phone, Repeat, Users, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { listInteractions, listLeads } from '@/lib/admin/analytics'
import { leadStageLabels } from '@/lib/admin/format'
import { interactionOutcomeLabels, interactionTypeLabels } from '@/lib/crm/labels'
import { cn } from '@/lib/utils'
import { INTERACTION_OUTCOMES, INTERACTION_TYPES, type Interaction, type InteractionOutcome, type InteractionType } from '@/types/crm'

export const metadata: Metadata = { title: 'Histórico de Interações' }

type Search = { lead?: string; tipo?: string; resultado?: string; de?: string; ate?: string; q?: string }

const selectClass =
  'h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'
const isDate = (v?: string) => Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v))

const typeIcon: Record<InteractionType, LucideIcon> = { cold_call: Phone, whatsapp: MessageCircle, reuniao: Users, email: Mail, follow_up: Repeat }

const outcomeTone: Record<InteractionOutcome, string> = {
  sucesso: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  agendado: 'bg-blue-500/15 text-blue-800 dark:text-blue-300',
  interessado: 'bg-amber-500/15 text-amber-900 dark:text-amber-300',
  sem_resposta: 'bg-muted text-muted-foreground',
  nao_interessado: 'bg-rose-500/15 text-rose-800 dark:text-rose-300',
}

/**
 * O "diário" de cada lead: histórico bruto de interações (notas + próximo passo), não só os
 * agregados do dashboard. Dados reais (tabela `interactions`) — ver nota em `listInteractions`.
 */
export default async function InteractionsHistoryPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const [interactions, leads] = await Promise.all([listInteractions(), listLeads()])
  const stageByLead = new Map(leads.map((l) => [l.id, l.stage] as const))

  const leadOptions = Array.from(new Map(interactions.map((i) => [i.leadId, i.leadLabel])).entries()).sort((a, b) =>
    a[1].localeCompare(b[1], 'pt-PT'),
  )

  const q = (sp.q ?? '').trim().toLowerCase()
  const filtered = interactions.filter((i) => {
    if (sp.lead && i.leadId !== sp.lead) return false
    if (sp.tipo && i.type !== sp.tipo) return false
    if (sp.resultado && i.outcome !== sp.resultado) return false
    if (isDate(sp.de) && i.occurredAt < `${sp.de}T00:00:00`) return false
    if (isDate(sp.ate) && i.occurredAt > `${sp.ate}T23:59:59`) return false
    if (q && !`${i.notes} ${i.nextStep} ${i.leadLabel}`.toLowerCase().includes(q)) return false
    return true
  })

  const groups = new Map<string, Interaction[]>()
  for (const i of filtered) groups.set(i.leadId, [...(groups.get(i.leadId) ?? []), i])

  const ordered = Array.from(groups.entries())
    .map(([leadId, items]) => ({ leadId, label: items[0].leadLabel, items: [...items].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)) }))
    .sort((a, b) => b.items[b.items.length - 1].occurredAt.localeCompare(a.items[a.items.length - 1].occurredAt))

  const openByDefault = Boolean(sp.lead) || ordered.length <= 6

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Histórico de Interações</h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          O diário de cada lead: todas as cold calls, WhatsApp, reuniões, emails e follow-ups já registados, com as notas e o próximo passo combinado
          em cada um — não só os números agregados do dashboard. Registe novas pelo Registo Rápido (Cmd/Ctrl+K).
        </p>
      </div>

      <form method="get" className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6" aria-label="Filtros">
        <label className="grid gap-1 text-xs font-medium sm:col-span-2 lg:col-span-2">
          Pesquisar
          <input type="search" name="q" defaultValue={sp.q ?? ''} placeholder="Empresa, nota ou próximo passo…" className={selectClass} />
        </label>
        <label className="grid gap-1 text-xs font-medium">
          Lead
          <select name="lead" defaultValue={sp.lead ?? ''} className={selectClass}>
            <option value="">Todos</option>
            {leadOptions.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium">
          Tipo
          <select name="tipo" defaultValue={sp.tipo ?? ''} className={selectClass}>
            <option value="">Todos</option>
            {INTERACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {interactionTypeLabels[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium">
          Resultado
          <select name="resultado" defaultValue={sp.resultado ?? ''} className={selectClass}>
            <option value="">Todos</option>
            {INTERACTION_OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {interactionOutcomeLabels[o]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium">
          De
          <input type="date" name="de" defaultValue={sp.de ?? ''} className={selectClass} />
        </label>
        <label className="grid gap-1 text-xs font-medium">
          Até
          <input type="date" name="ate" defaultValue={sp.ate ?? ''} className={selectClass} />
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit" size="sm">
            Filtrar
          </Button>
          <Button render={<Link href="/admin/crm/interacoes" />} nativeButton={false} variant="ghost" size="sm">
            Limpar
          </Button>
        </div>
      </form>

      <p role="status" className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? 'interação' : 'interações'} · {ordered.length} {ordered.length === 1 ? 'lead' : 'leads'}
      </p>

      {ordered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Sem interações para estes filtros.</p>
      ) : (
        <div className="grid gap-4">
          {ordered.map((group) => {
            const stage = stageByLead.get(group.leadId)
            return (
              <details key={group.leadId} open={openByDefault} className="group rounded-2xl border border-border bg-card">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 items-center gap-2">
                    <NotebookText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate font-semibold">{group.label}</span>
                    {stage && (
                      <Badge variant="outline" className="h-auto shrink-0 px-2 py-0.5 text-[0.7rem]">
                        {leadStageLabels[stage]}
                      </Badge>
                    )}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {group.items.length} {group.items.length === 1 ? 'registo' : 'registos'}
                  </span>
                </summary>
                <ol className="grid gap-3 border-t border-border p-4">
                  {group.items.map((interaction) => {
                    const Icon = typeIcon[interaction.type]
                    return (
                      <li key={interaction.id} className="grid gap-1.5 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                          <span className="font-medium">{interactionTypeLabels[interaction.type]}</span>
                          <Badge className={cn('h-auto px-2 py-0.5 text-[0.7rem]', outcomeTone[interaction.outcome])} variant="outline">
                            {interactionOutcomeLabels[interaction.outcome]}
                          </Badge>
                          <span className="ml-auto flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                            <CalendarClock className="size-3" aria-hidden />
                            {new Date(interaction.occurredAt).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Lisbon' })}
                          </span>
                        </div>
                        {interaction.notes && <p className="text-muted-foreground">{interaction.notes}</p>}
                        {interaction.nextStep && <p className="text-xs font-medium text-primary">→ Próximo passo: {interaction.nextStep}</p>}
                      </li>
                    )
                  })}
                </ol>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
