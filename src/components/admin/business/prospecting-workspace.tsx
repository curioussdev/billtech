'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { CalendarPlus, FileText, Flame, Snowflake, XCircle } from 'lucide-react'
import { moveLead } from '@/actions/pipeline'
import { scheduleMeeting } from '@/actions/meetings'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { SendProposalDialog } from '@/components/admin/crm/send-proposal-dialog'
import { DAY_MS, daysInStage, prospectingMetrics } from '@/lib/admin/business'
import { formatEUR, formatPct, leadChannelLabels, sectorLabels } from '@/lib/admin/format'
import { cn } from '@/lib/utils'
import type { Lead, Meeting, MeetingKind } from '@/types/lead'

const kindLabels: Record<MeetingKind, string> = { reuniao: 'Reunião', demo: 'Demo', 'follow-up': 'Follow-up' }
const kindStyles: Record<MeetingKind, string> = {
  reuniao: 'bg-sky-500/15 text-sky-800 dark:text-sky-300',
  demo: 'bg-violet-500/15 text-violet-800 dark:text-violet-300',
  'follow-up': 'bg-amber-500/15 text-amber-900 dark:text-amber-300',
}

const channelConfig = { leads: { label: 'Leads', color: 'var(--chart-1)' } } satisfies ChartConfig

/** Frio = ainda sem resposta ou lead novo; Morno = já qualificado ou com conversa em curso. */
const temperature = (lead: Lead): 'frio' | 'morno' => (lead.stage === 'qualificado' || (lead.firstResponseHours !== null && lead.followUps > 0) ? 'morno' : 'frio')

const toLocalInput = (iso: string) => iso.slice(0, 16)

type Props = { initialLeads: Lead[]; initialMeetings: Meeting[]; nowIso: string }

export function ProspectingWorkspace({ initialLeads, initialMeetings, nowIso }: Props) {
  const router = useRouter()
  const now = useMemo(() => new Date(nowIso), [nowIso])
  const [leads, setLeads] = useState(initialLeads)
  const meetings = initialMeetings
  const [scheduling, setScheduling] = useState<string | null>(null)
  const [when, setWhen] = useState('')
  const [schedulingPending, setSchedulingPending] = useState(false)
  const [note, setNote] = useState('')
  const [proposalFor, setProposalFor] = useState<Lead | null>(null)

  const metrics = useMemo(() => prospectingMetrics(leads), [leads])
  const prospects = leads.filter((l) => l.stage === 'captado' || l.stage === 'qualificado')

  async function changeStage(lead: Lead, stage: 'perdido') {
    if (!window.confirm(`Marcar «${lead.company}» como perdido?`)) return
    const previous = leads
    setLeads((all) => all.map((l) => (l.id === lead.id ? { ...l, stage, stageEnteredAt: now.toISOString() } : l)))
    const result = await moveLead(lead.id, stage)
    if (!result.ok) {
      setLeads(previous)
      setNote(`Não foi possível atualizar ${lead.company}: ${result.message}`)
      return
    }
    setNote(`${lead.company} marcado como perdido.`)
  }

  function confirmProposal(value: number) {
    if (!proposalFor) return
    const lead = proposalFor
    setLeads((all) => all.map((l) => (l.id === lead.id ? { ...l, stage: 'proposta', stageEnteredAt: now.toISOString(), estimatedValue: value } : l)))
    setNote(`${lead.company}: proposta enviada (${formatEUR(value)}) — movido para «Proposta Enviada».`)
    setProposalFor(null)
  }

  async function schedule(lead: Lead) {
    if (!when) return
    setSchedulingPending(true)
    const result = await scheduleMeeting({ leadId: lead.id, leadLabel: lead.company, start: new Date(when).toISOString() })
    setSchedulingPending(false)
    setScheduling(null)
    setWhen('')
    if (!result.ok) {
      setNote(`Não foi possível agendar a reunião: ${result.message}`)
      return
    }
    setNote(`Reunião com ${lead.company} agendada — enviámos um lembrete por email.`)
    router.refresh()
  }

  // Semana corrente (segunda a domingo) da data de referência
  const monday = new Date(now.getTime() - ((now.getUTCDay() + 6) % 7) * DAY_MS)
  monday.setUTCHours(0, 0, 0, 0)
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getTime() + i * DAY_MS))
  const dayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10)
  const weekMeetings = meetings.filter((m) => days.some((d) => dayKey(d) === dayKey(m.start))).sort((a, b) => a.start.localeCompare(b.start))
  const nextMeeting = meetings.filter((m) => new Date(m.start) >= now).sort((a, b) => a.start.localeCompare(b.start))[0]

  const cards = [
    { label: 'Tempo médio de resposta', value: `${metrics.avgResponseHours.toFixed(1).replace('.', ',')} h`, hint: `${metrics.unansweredCount} leads ainda sem resposta` },
    { label: 'Taxa de follow-up', value: formatPct(metrics.followUpRatePct), hint: 'Leads em aberto com pelo menos 1 follow-up' },
    { label: 'Leads em prospeção', value: String(prospects.length), hint: 'Captados e qualificados' },
  ]

  return (
    <div className="grid gap-8">
      <section aria-label="Métricas de prospeção" className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
            <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-2xl font-black tabular-nums sm:text-3xl">{c.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
          </div>
        ))}
      </section>

      <div role="status" aria-live="polite" className="min-h-5 text-sm font-medium text-primary">
        {note}
      </div>

      <section aria-labelledby="agenda" className="rounded-2xl border-2 border-primary/20 bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="agenda" className="text-xl font-bold">
            Reuniões agendadas desta semana — {weekMeetings.length}
          </h2>
          {nextMeeting && (
            <p className="text-sm text-muted-foreground">
              Próxima: <strong className="text-foreground">{new Date(nextMeeting.start).toLocaleString('pt-PT', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}</strong>
            </p>
          )}
        </div>
        <ol className="grid gap-2 sm:grid-cols-7">
          {days.map((d) => {
            const dayMeetings = weekMeetings.filter((m) => dayKey(m.start) === dayKey(d))
            const isToday = dayKey(d) === dayKey(now)
            return (
              <li key={d.toISOString()} className={cn('grid gap-1.5 rounded-xl p-2', isToday && 'bg-primary/10 ring-1 ring-primary/30')}>
                <p className={cn('text-sm font-semibold capitalize', isToday && 'text-primary')}>{d.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', timeZone: 'UTC' })}</p>
                {dayMeetings.length === 0 ? (
                  <p className="text-xs text-muted-foreground">—</p>
                ) : (
                  <ul className="grid gap-1">
                    {dayMeetings.map((m) => (
                      <li key={m.id} className="grid gap-0.5 rounded-lg bg-background p-1.5 text-xs">
                        <time dateTime={m.start} className="font-bold tabular-nums">
                          {new Date(m.start).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                        </time>
                        <span className={cn('w-fit rounded-full px-1.5 py-0.5 font-semibold', kindStyles[m.kind])}>{kindLabels[m.kind]}</span>
                        <span className="truncate text-muted-foreground" title={m.title}>{m.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="leads-prospecao">
          <h2 id="leads-prospecao" className="mb-3 text-xl font-bold">
            Leads frios e mornos
          </h2>
          {prospects.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-8 text-muted-foreground">Sem leads em prospeção.</p>
          ) : (
            <ul className="grid gap-3">
              {prospects.map((lead) => {
                const temp = temperature(lead)
                const TempIcon = temp === 'morno' ? Flame : Snowflake
                return (
                  <li key={lead.id} className="grid gap-3 rounded-2xl border border-border bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold leading-tight">{lead.company}</h3>
                        <p className="text-sm text-muted-foreground">
                          {lead.contactName} · {sectorLabels[lead.sector]} · via {leadChannelLabels[lead.channel]}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', temp === 'morno' ? 'bg-orange-500/15 text-orange-900 dark:text-orange-300' : 'bg-sky-500/15 text-sky-800 dark:text-sky-300')}>
                          <TempIcon className="size-3" aria-hidden /> {temp === 'morno' ? 'Morno' : 'Frio'}
                        </span>
                        <strong className="tabular-nums">{formatEUR(lead.estimatedValue)}</strong>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {daysInStage(lead, now)} dias na etapa · {lead.followUps} follow-ups · {lead.firstResponseHours === null ? 'sem resposta ainda' : `1.ª resposta em ${lead.firstResponseHours} h`}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => (setScheduling(scheduling === lead.id ? null : lead.id), setWhen(toLocalInput(now.toISOString())))} aria-expanded={scheduling === lead.id}>
                        <CalendarPlus aria-hidden /> Agendar reunião
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setProposalFor(lead)}>
                        <FileText aria-hidden /> Enviar proposta
                      </Button>
                      <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => void changeStage(lead, 'perdido')}>
                        <XCircle aria-hidden /> Marcar como perdido
                      </Button>
                    </div>
                    {scheduling === lead.id && (
                      <div className="flex flex-wrap items-end gap-2 rounded-xl bg-muted/50 p-3">
                        <label className="grid gap-1 text-xs font-medium">
                          Data e hora
                          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm focus-visible:ring-2 focus-visible:ring-ring" />
                        </label>
                        <Button type="button" size="sm" onClick={() => void schedule(lead)} disabled={!when || schedulingPending}>
                          {schedulingPending ? 'A agendar…' : 'Confirmar'}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setScheduling(null)}>
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="canais">
          <h2 id="canais" className="mb-3 text-xl font-bold">
            Leads por canal
          </h2>
          <div className="rounded-2xl border border-border bg-card p-4">
            <ChartContainer config={channelConfig} className="h-56 w-full" role="img" aria-label={`Leads por canal: ${metrics.byChannel.map((c) => `${leadChannelLabels[c.channel]} ${c.leads}`).join(', ')}`}>
              <BarChart data={metrics.byChannel.map((c) => ({ canal: leadChannelLabels[c.channel], leads: c.leads }))} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="canal" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={24} />
                <ChartTooltip cursor={{ fill: 'var(--muted)', opacity: 0.5 }} content={<ChartTooltipContent hideIndicator />} />
                <Bar dataKey="leads" fill="var(--color-leads)" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ChartContainer>
          </div>
        </section>
      </div>

      <SendProposalDialog
        open={proposalFor !== null}
        leadId={proposalFor?.id ?? ''}
        leadLabel={proposalFor?.company ?? ''}
        defaultValue={proposalFor?.estimatedValue ?? 0}
        onClose={() => setProposalFor(null)}
        onConfirm={confirmProposal}
      />
    </div>
  )
}
