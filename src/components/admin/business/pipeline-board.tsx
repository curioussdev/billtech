'use client'

import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { ArrowRight, CalendarClock, CheckCircle2, GripVertical, NotebookPen, User, XCircle } from 'lucide-react'
import { addLeadNote, linkLeadToClient, moveLead } from '@/actions/pipeline'
import { useToast } from '@/components/admin/crm/toast'
import { LostDealDialog } from '@/components/admin/crm/lost-deal-dialog'
import { SendProposalDialog } from '@/components/admin/crm/send-proposal-dialog'
import { WinDealDialog, type WinDealPayload } from '@/components/admin/crm/win-deal-dialog'
import { SearchableSelect } from '@/components/ui/combobox'
import { daysInStage, funnelMetrics, OPEN_STAGES, STALE_STAGE_DAYS, weightedValue } from '@/lib/admin/business'
import { formatEUR, formatPct, leadStageLabels, sectorLabels } from '@/lib/admin/format'
import { lossReasonLabels } from '@/lib/crm/labels'
import { cn } from '@/lib/utils'
import type { LossReason } from '@/types/crm'
import { LEAD_STAGES, type Lead, type LeadStage } from '@/types/lead'

const stageStyles: Record<LeadStage, string> = {
  captado: 'border-border bg-muted/40',
  qualificado: 'border-border bg-muted/40',
  proposta: 'border-border bg-muted/40',
  negociacao: 'border-border bg-muted/40',
  ganho: 'border-emerald-500/40 bg-emerald-500/10',
  perdido: 'border-red-500/40 bg-red-500/10',
}

type CardProps = {
  lead: Lead
  now: Date
  nextStep?: string
  onMove?: (stage: LeadStage) => void
  portalClients?: PortalClientOption[]
  onLinkClient?: (clientId: string | null) => void
}

/** Nota opcional sobre a última interação — disponível em qualquer etapa, nunca obrigatória. */
function AddNoteButton({ leadId, leadLabel }: { leadId: string; leadLabel: string }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [pending, setPending] = useState(false)
  const { push } = useToast()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    const result = await addLeadNote({ leadId, leadLabel, note })
    setPending(false)
    if (!result.ok) {
      push(result.message, 'error')
      return
    }
    push('Nota guardada.', 'success')
    setNote('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <NotebookPen className="size-3" aria-hidden /> Adicionar nota
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-1.5">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="O que aconteceu na última interação…"
        rows={2}
        maxLength={1000}
        autoFocus
        className="w-full rounded-md border border-input bg-background p-1.5 text-xs focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="flex gap-1.5">
        <button type="submit" disabled={pending || !note.trim()} className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50">
          {pending ? 'A guardar…' : 'Guardar'}
        </button>
        <button type="button" onClick={() => (setOpen(false), setNote(''))} className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
          Cancelar
        </button>
      </div>
    </form>
  )
}

/** Aparência do cartão (sem hooks de arrasto): reutilizada no cartão real e na "sombra" do DragOverlay. */
function LeadCardView({ lead, now, nextStep, onMove, portalClients, onLinkClient, handle, dragging, overlay }: CardProps & { handle: React.ReactNode; dragging?: boolean; overlay?: boolean }) {
  const days = daysInStage(lead, now)
  const stale = OPEN_STAGES.includes(lead.stage) && days > STALE_STAGE_DAYS

  return (
    <div className={cn('grid gap-2 rounded-xl border border-border bg-card p-3 text-sm shadow-sm', dragging && 'opacity-40', overlay && 'shadow-xl ring-2 ring-primary')}>
      <div className="flex items-start gap-2">
        {handle}
        <div className="min-w-0">
          <h4 className="truncate font-semibold leading-tight">{lead.company}</h4>
          <p className="truncate text-xs text-muted-foreground">{lead.contactName} · {sectorLabels[lead.sector]}</p>
        </div>
      </div>
      <p className="text-base font-bold tabular-nums">{formatEUR(lead.estimatedValue)}</p>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className={cn('inline-flex items-center gap-1', stale && 'font-semibold text-red-700 dark:text-red-400')}>
          <CalendarClock className="size-3" aria-hidden />
          {days} {days === 1 ? 'dia' : 'dias'} na etapa
        </span>
        <span className="inline-flex items-center gap-1">
          <User className="size-3" aria-hidden />
          {lead.owner}
        </span>
      </p>
      {nextStep && (
        <p className="flex items-start gap-1 truncate text-xs text-muted-foreground" title={nextStep}>
          <ArrowRight className="mt-0.5 size-3 shrink-0" aria-hidden />
          <span className="truncate">{nextStep}</span>
        </p>
      )}
      {onMove && (
        <select
          value={lead.stage}
          onChange={(e) => onMove(e.target.value as LeadStage)}
          aria-label={`Mover ${lead.company} para outra etapa`}
          className="h-8 rounded-md border border-input bg-background px-1.5 text-xs focus-visible:ring-2 focus-visible:ring-ring"
        >
          {LEAD_STAGES.map((st) => (
            <option key={st} value={st}>
              {leadStageLabels[st]}
            </option>
          ))}
        </select>
      )}
      {onLinkClient && portalClients && (
        <SearchableSelect
          items={portalClients.map((c) => ({ value: c.id, label: c.name }))}
          value={lead.clientId ?? null}
          onValueChange={onLinkClient}
          ariaLabel={`Associar ${lead.company} a uma conta de cliente`}
          placeholder="Sem cliente associado"
          emptyMessage="Nenhum cliente encontrado."
          className="h-8 px-1.5 text-xs"
        />
      )}
      {onMove && !overlay && <AddNoteButton leadId={lead.id} leadLabel={lead.company} />}
    </div>
  )
}

const handleClass = 'mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing'

/** Cartão arrastável: a pega é o único alvo de arrasto, o resto do cartão (menu incluído) continua utilizável. */
function LeadCard({ lead, now, nextStep, onMove, portalClients, onLinkClient }: CardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id })
  return (
    <li ref={setNodeRef}>
      <LeadCardView
        lead={lead}
        now={now}
        nextStep={nextStep}
        onMove={onMove}
        portalClients={portalClients}
        onLinkClient={onLinkClient}
        dragging={isDragging}
        handle={
          <button type="button" {...attributes} {...listeners} aria-label={`Arrastar ${lead.company}`} className={handleClass}>
            <GripVertical className="size-4" aria-hidden />
          </button>
        }
      />
    </li>
  )
}

function Column({
  stage,
  leads,
  now,
  nextSteps,
  portalClients,
  onMove,
  onLinkClient,
}: {
  stage: LeadStage
  leads: Lead[]
  now: Date
  nextSteps: Record<string, string>
  portalClients: PortalClientOption[]
  onMove: (id: string, stage: LeadStage) => void
  onLinkClient: (id: string, clientId: string | null) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const total = leads.reduce((acc, l) => acc + l.estimatedValue, 0)
  const weighted = OPEN_STAGES.includes(stage) ? weightedValue(leads) : null

  return (
    <section ref={setNodeRef} aria-labelledby={`col-${stage}`} className={cn('flex min-h-64 w-72 shrink-0 flex-col rounded-2xl border p-3 transition-colors', stageStyles[stage], isOver && 'ring-2 ring-primary')}>
      <header className="mb-3 px-1">
        <h3 id={`col-${stage}`} className="flex items-center gap-1.5 text-sm font-bold">
          {stage === 'ganho' && <CheckCircle2 className="size-4 text-emerald-700 dark:text-emerald-400" aria-hidden />}
          {stage === 'perdido' && <XCircle className="size-4 text-red-700 dark:text-red-400" aria-hidden />}
          {leadStageLabels[stage]}
          <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs font-semibold tabular-nums">{leads.length}</span>
        </h3>
        <p className="text-xs tabular-nums text-muted-foreground">{formatEUR(total)}</p>
        {weighted !== null && (
          <p className="text-xs tabular-nums text-muted-foreground" title="Valor ponderado pela probabilidade de fecho da etapa">
            {formatEUR(weighted)} ponderado
          </p>
        )}
      </header>
      <ul className="grid flex-1 content-start gap-2" aria-label={`Leads em ${leadStageLabels[stage]}`}>
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} now={now} nextStep={nextSteps[lead.id]} portalClients={portalClients} onMove={(s) => onMove(lead.id, s)} onLinkClient={(c) => onLinkClient(lead.id, c)} />
        ))}
        {leads.length === 0 && <li className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">Largue um lead aqui</li>}
      </ul>
    </section>
  )
}

export type PortalClientOption = { id: string; name: string }

export function PipelineBoard({
  initialLeads,
  nowIso,
  ltv,
  acquisitionSpend,
  nextSteps,
  portalClients,
}: {
  initialLeads: Lead[]
  nowIso: string
  ltv: number
  acquisitionSpend: number
  nextSteps: Record<string, string>
  portalClients: PortalClientOption[]
}) {
  const now = useMemo(() => new Date(nowIso), [nowIso])
  const [leads, setLeads] = useState(initialLeads)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [pendingClose, setPendingClose] = useState<{ leadId: string; leadLabel: string; stage: 'ganho' | 'perdido' } | null>(null)
  const [pendingProposal, setPendingProposal] = useState<{ leadId: string; leadLabel: string; defaultValue: number } | null>(null)
  const { push } = useToast()

  async function linkClient(id: string, clientId: string | null) {
    const previous = leads
    setLeads((all) => all.map((l) => (l.id === id ? { ...l, ...(clientId ? { clientId } : { clientId: undefined }) } : l)))
    const result = await linkLeadToClient(id, clientId)
    if (!result.ok) {
      setLeads(previous)
      setAnnouncement(`Não foi possível associar o cliente: ${result.message}`)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  // Métricas recalculadas ao vivo a cada movimento
  const metrics = useMemo(() => funnelMetrics(leads, [], acquisitionSpend), [leads, acquisitionSpend])
  const openWeighted = useMemo(() => weightedValue(leads.filter((l) => OPEN_STAGES.includes(l.stage))), [leads])
  const byStage = useMemo(() => Object.fromEntries(LEAD_STAGES.map((s) => [s, leads.filter((l) => l.stage === s)])) as Record<LeadStage, Lead[]>, [leads])
  const activeLead = leads.find((l) => l.id === activeId) ?? null

  async function move(id: string, stage: LeadStage) {
    const lead = leads.find((l) => l.id === id)
    if (!lead || lead.stage === stage) return
    const previous = leads
    setLeads((all) => all.map((l) => (l.id === id ? { ...l, stage, stageEnteredAt: now.toISOString() } : l)))
    setAnnouncement(`${lead.company} movido para ${leadStageLabels[stage]}.`)

    const result = await moveLead(id, stage)
    if (!result.ok) {
      setLeads(previous) // reverte se o servidor recusar
      setAnnouncement(`Não foi possível mover ${lead.company}: ${result.message}`)
    }
  }

  // Ganho/Perdido são etapas terminais: exigem confirmação (mini-form ou motivo) antes de mover.
  // Proposta exige o valor proposto. Enquanto o modal está aberto o cartão fica na coluna original
  // (só mutamos `leads` ao confirmar).
  function requestStageChange(id: string, stage: LeadStage) {
    const lead = leads.find((l) => l.id === id)
    if (!lead || lead.stage === stage) return
    if (stage === 'ganho' || stage === 'perdido') {
      setPendingClose({ leadId: id, leadLabel: lead.company, stage })
      return
    }
    if (stage === 'proposta') {
      setPendingProposal({ leadId: id, leadLabel: lead.company, defaultValue: lead.estimatedValue })
      return
    }
    void move(id, stage)
  }

  function confirmProposal(value: number) {
    if (!pendingProposal) return
    const { leadId, leadLabel } = pendingProposal
    setLeads((all) => all.map((l) => (l.id === leadId ? { ...l, stage: 'proposta', stageEnteredAt: now.toISOString(), estimatedValue: value } : l)))
    setAnnouncement(`${leadLabel} movido para Proposta Enviada.`)
    push(`Proposta enviada: ${leadLabel} — ${formatEUR(value)}.`, 'success')
    setPendingProposal(null)
  }

  function confirmWin(payload: WinDealPayload) {
    if (!pendingClose) return
    const { leadId, leadLabel } = pendingClose
    setLeads((all) => all.map((l) => (l.id === leadId ? { ...l, stage: 'ganho', stageEnteredAt: now.toISOString(), projectName: payload.projectName, projectType: payload.projectType, estimatedValue: payload.value } : l)))
    setAnnouncement(`${leadLabel} movido para Ganho.`)
    push(`Negócio ganho: ${leadLabel} — ${formatEUR(payload.value)}.`, 'success')
    if (payload.invoiceCreated) push('Fatura criada no financeiro.', 'success')
    setPendingClose(null)
  }

  function confirmLoss(reason: LossReason) {
    if (!pendingClose) return
    const { leadId, leadLabel } = pendingClose
    setLeads((all) => all.map((l) => (l.id === leadId ? { ...l, stage: 'perdido', stageEnteredAt: now.toISOString(), lossReason: reason } : l)))
    setAnnouncement(`${leadLabel} movido para Perdido.`)
    push(`Negócio perdido: ${leadLabel} (${lossReasonLabels[reason]}).`, 'error')
    setPendingClose(null)
  }

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    if (e.over && (LEAD_STAGES as readonly string[]).includes(String(e.over.id))) requestStageChange(String(e.active.id), e.over.id as LeadStage)
  }

  const nameOf = (id: string | number) => leads.find((l) => l.id === id)?.company ?? 'lead'
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Pegou em ${nameOf(active.id)}. Use as setas para escolher uma etapa e Enter para largar.`,
    onDragOver: ({ active, over }) => (over ? `${nameOf(active.id)} sobre ${leadStageLabels[over.id as LeadStage] ?? 'uma etapa'}.` : `${nameOf(active.id)} fora de qualquer etapa.`),
    onDragEnd: ({ active, over }) => (over ? `${nameOf(active.id)} largado em ${leadStageLabels[over.id as LeadStage] ?? 'uma etapa'}.` : `${nameOf(active.id)} largado sem mudar de etapa.`),
    onDragCancel: ({ active }) => `Movimento de ${nameOf(active.id)} cancelado.`,
  }

  const cards = [
    { label: 'Taxa de conversão geral', value: formatPct(metrics.conversionPct), hint: 'Lead → Ganho' },
    { label: 'CAC estimado', value: formatEUR(metrics.cac), hint: `${formatEUR(acquisitionSpend)} investidos (90 dias) ÷ negócios ganhos` },
    { label: 'LTV médio', value: formatEUR(ltv), hint: 'Lucro bruto médio por cliente' },
    { label: 'Valor total no pipeline', value: formatEUR(metrics.pipelineValue), hint: 'Leads em aberto (sem ponderar)' },
    { label: 'Valor ponderado no pipeline', value: formatEUR(openWeighted), hint: 'Ponderado pela probabilidade de fecho de cada etapa' },
  ]

  return (
    <div className="grid gap-6">
      <section aria-label="Métricas do funil" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
            <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-2xl font-black tabular-nums sm:text-3xl">{c.value}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground" title={c.hint}>{c.hint}</p>
          </div>
        ))}
      </section>

      <p className="text-sm text-muted-foreground">Arraste os cartões pela pega, ou use o menu «Mover para» de cada cartão (funciona também com teclado e leitor de ecrã).</p>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)} accessibility={{ announcements, screenReaderInstructions: { draggable: 'Prima Espaço ou Enter para pegar no lead, use as setas para escolher a etapa e Espaço ou Enter para largar. Esc cancela.' } }}>
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
          <div className="flex gap-4">
            {LEAD_STAGES.map((stage) => (
              <Column key={stage} stage={stage} leads={byStage[stage]} now={now} nextSteps={nextSteps} portalClients={portalClients} onMove={requestStageChange} onLinkClient={linkClient} />
            ))}
          </div>
        </div>
        <DragOverlay>{activeLead ? <div className="w-72"><LeadCardView lead={activeLead} now={now} overlay handle={<span className={handleClass}><GripVertical className="size-4" aria-hidden /></span>} /></div> : null}</DragOverlay>
      </DndContext>

      <div role="status" aria-live="polite" className="text-sm font-medium text-primary">
        {announcement}
      </div>

      <WinDealDialog
        open={pendingClose?.stage === 'ganho'}
        leadId={pendingClose?.leadId ?? ''}
        leadLabel={pendingClose?.leadLabel ?? ''}
        defaultValue={pendingClose ? (leads.find((l) => l.id === pendingClose.leadId)?.estimatedValue ?? 0) : 0}
        hasClient={pendingClose ? Boolean(leads.find((l) => l.id === pendingClose.leadId)?.clientId) : false}
        onClose={() => setPendingClose(null)}
        onConfirm={confirmWin}
      />
      <LostDealDialog open={pendingClose?.stage === 'perdido'} leadId={pendingClose?.leadId ?? ''} leadLabel={pendingClose?.leadLabel ?? ''} onClose={() => setPendingClose(null)} onConfirm={confirmLoss} />
      <SendProposalDialog
        open={pendingProposal !== null}
        leadId={pendingProposal?.leadId ?? ''}
        leadLabel={pendingProposal?.leadLabel ?? ''}
        defaultValue={pendingProposal?.defaultValue ?? 0}
        onClose={() => setPendingProposal(null)}
        onConfirm={confirmProposal}
      />
    </div>
  )
}
