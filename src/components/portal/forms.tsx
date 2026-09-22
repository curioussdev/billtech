'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { adminReply, createRequest, replyToRequest, saveClientProject, updateProfile, updateRequestMeta, type PortalFormState } from '@/actions/portal'
import { AttachmentUploader } from '@/components/portal/attachments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { priorityLabels, projectStageLabels, requestStatusLabels, requestTypeHints, requestTypeLabels } from '@/lib/portal/labels'
import { cn } from '@/lib/utils'
import { PROJECT_STAGES, REQUEST_PRIORITIES, REQUEST_STATUSES, REQUEST_TYPES, type PortalProject, type RequestPriority, type RequestStatus, type RequestType } from '@/types/portal'

const initial: PortalFormState = { status: 'idle' }

const selectClass =
  'h-11 w-full rounded-lg border border-input bg-background px-2.5 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none sm:text-sm'

function Feedback({ state }: { state: PortalFormState }) {
  return (
    <>
      <div role="status" aria-live="polite">
        {state.status === 'success' && <p className="text-sm font-medium text-primary">{state.message}</p>}
      </div>
      <div role="alert">{state.status === 'error' && state.message && <p className="text-sm font-medium text-destructive">{state.message}</p>}</div>
    </>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={`${id}-error`} className="text-sm font-medium text-destructive">
      {message}
    </p>
  ) : null
}

function Submit({ pending, children, icon }: { pending: boolean; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Button type="submit" disabled={pending} className="h-11 w-fit rounded-xl px-6">
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : icon} {children}
    </Button>
  )
}

// ─── Novo pedido (cliente) ──────────────────────────────────────────────────

export function NewRequestForm({ projects, defaultType, defaultProjectId, defaultTitle }: { projects: Pick<PortalProject, 'id' | 'name'>[]; defaultType?: RequestType; defaultProjectId?: string; defaultTitle?: string }) {
  const [state, action, pending] = useActionState(createRequest, initial)
  const errors = state.fieldErrors ?? {}
  const v = state.values ?? {}
  const selectedType = (v.type as RequestType | undefined) ?? defaultType

  return (
    <form action={action} className="grid gap-6">
      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-medium">O que precisa?</legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REQUEST_TYPES.map((type) => (
            <label key={type} className="relative flex cursor-pointer flex-col gap-1 rounded-xl border border-border bg-card p-4 has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/70">
              <input type="radio" name="type" value={type} required defaultChecked={selectedType === type} className="sr-only" aria-describedby={errors.type ? 'type-error' : undefined} />
              <span className="font-semibold">{requestTypeLabels[type]}</span>
              <span className="text-xs text-muted-foreground">{requestTypeHints[type]}</span>
            </label>
          ))}
        </div>
        <FieldError id="type" message={errors.type} />
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="projectId">Projeto relacionado (opcional)</Label>
          <select id="projectId" name="projectId" defaultValue={v.projectId ?? defaultProjectId ?? ''} className={selectClass}>
            <option value="">Nenhum / geral</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="priority">Urgência</Label>
          <select id="priority" name="priority" defaultValue={v.priority ?? 'normal'} className={selectClass}>
            {REQUEST_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {priorityLabels[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="title">Assunto</Label>
        <Input id="title" name="title" required maxLength={120} defaultValue={v.title ?? defaultTitle} placeholder="Ex.: Adicionar campo de NIF ao formulário de faturação" aria-invalid={errors.title ? true : undefined} aria-describedby={errors.title ? 'title-error' : undefined} className="h-11 text-base" />
        <FieldError id="title" message={errors.title} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descreva o pedido</Label>
        <Textarea id="description" name="description" required minLength={10} maxLength={4000} defaultValue={v.description} rows={7} placeholder="Quanto mais detalhe, melhor: o que pretende, porquê, e o resultado esperado. Pode acrescentar links de exemplo." aria-invalid={errors.description ? true : undefined} aria-describedby={errors.description ? 'description-error' : undefined} className="text-base" />
        <FieldError id="description" message={errors.description} />
      </div>

      <Submit pending={pending} icon={<Send aria-hidden />}>
        Enviar pedido
      </Submit>
      <Feedback state={state} />
    </form>
  )
}

// ─── Responder (cliente e admin) ────────────────────────────────────────────

export function ReplyForm({ requestId, variant, placeholder }: { requestId: string; variant: 'client' | 'admin'; placeholder?: string }) {
  const [state, action, pending] = useActionState(variant === 'admin' ? adminReply : replyToRequest, initial)
  const formRef = useRef<HTMLFormElement>(null)
  // Muda a cada envio com sucesso: remonta o AttachmentUploader, limpando os anexos já ligados à mensagem enviada.
  const [uploaderKey, setUploaderKey] = useState(0)

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset()
      setUploaderKey((k) => k + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage a novas submissões (identidade do state muda a cada action)
  }, [state])

  return (
    <form ref={formRef} action={action} className="grid gap-3 rounded-2xl border border-border bg-card p-4">
      <input type="hidden" name="requestId" value={requestId} />
      <Label htmlFor={`body-${variant}`} className="sr-only">
        A sua mensagem
      </Label>
      <Textarea id={`body-${variant}`} name="body" required rows={4} maxLength={4000} placeholder={placeholder ?? 'Escreva a sua mensagem…'} className="text-base" />
      <AttachmentUploader key={uploaderKey} requestId={requestId} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        {variant === 'admin' ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="internal" className="size-4 accent-[var(--primary)]" /> Nota interna (o cliente não vê)
          </label>
        ) : (
          <span />
        )}
        <Submit pending={pending} icon={<Send aria-hidden />}>
          {variant === 'admin' ? 'Enviar' : 'Enviar mensagem'}
        </Submit>
      </div>
      <Feedback state={state} />
    </form>
  )
}

// ─── Estado e prioridade (admin) ────────────────────────────────────────────

export function RequestMetaForm({ requestId, status, priority }: { requestId: string; status: RequestStatus; priority: RequestPriority }) {
  const [state, action, pending] = useActionState(updateRequestMeta, initial)

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="requestId" value={requestId} />
      <div className="grid gap-2">
        <Label htmlFor="meta-status">Estado</Label>
        <select id="meta-status" name="status" defaultValue={status} className={selectClass}>
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {requestStatusLabels[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="meta-priority">Prioridade</Label>
        <select id="meta-priority" name="priority" defaultValue={priority} className={selectClass}>
          {REQUEST_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {priorityLabels[p]}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-muted-foreground">Ao mudar o estado, o cliente recebe um email.</p>
      <Submit pending={pending}>Guardar</Submit>
      <Feedback state={state} />
    </form>
  )
}

// ─── Perfil (cliente) ───────────────────────────────────────────────────────

export function ProfileForm({ fullName, company, email }: { fullName: string; company: string; email: string }) {
  const [state, action, pending] = useActionState(updateProfile, initial)
  const errors = state.fieldErrors ?? {}

  return (
    <form action={action} className="grid max-w-lg gap-5">
      <div className="grid gap-2">
        <Label htmlFor="fullName">Nome</Label>
        <Input id="fullName" name="fullName" required defaultValue={state.values?.fullName ?? fullName} className="h-11 text-base" autoComplete="name" />
        <FieldError id="fullName" message={errors.fullName} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="company">Empresa</Label>
        <Input id="company" name="company" defaultValue={state.values?.company ?? company} className="h-11 text-base" autoComplete="organization" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} readOnly className="h-11 bg-muted text-base" aria-describedby="email-hint" />
        <p id="email-hint" className="text-xs text-muted-foreground">
          Para alterar o email, contacte a equipa BillTech.
        </p>
      </div>
      <Submit pending={pending}>Guardar alterações</Submit>
      <Feedback state={state} />
    </form>
  )
}

// ─── Projeto de cliente (admin) ─────────────────────────────────────────────

export function ClientProjectForm({ clientId, project }: { clientId: string; project?: PortalProject }) {
  const [state, action, pending] = useActionState(saveClientProject, initial)
  const errors = state.fieldErrors ?? {}
  const v = state.values ?? {}
  const idp = project?.id ?? 'new'

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={project?.id ?? ''} />
      <input type="hidden" name="clientId" value={clientId} />
      <div className="grid gap-2">
        <Label htmlFor={`name-${idp}`}>Nome do projeto</Label>
        <Input id={`name-${idp}`} name="name" required defaultValue={v.name ?? project?.name} />
        <FieldError id={`name-${idp}`} message={errors.name} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`description-${idp}`}>Descrição (visível para o cliente)</Label>
        <Textarea id={`description-${idp}`} name="description" rows={3} defaultValue={v.description ?? project?.description} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor={`status-${idp}`}>Etapa</Label>
          <select id={`status-${idp}`} name="status" defaultValue={v.status ?? project?.status ?? 'planeamento'} className={cn(selectClass, 'h-9')}>
            {PROJECT_STAGES.map((s) => (
              <option key={s} value={s}>
                {projectStageLabels[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`progress-${idp}`}>Progresso (0–100)</Label>
          <Input id={`progress-${idp}`} name="progress" type="number" min={0} max={100} defaultValue={v.progress ?? project?.progress ?? 0} />
          <FieldError id={`progress-${idp}`} message={errors.progress} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`dueDate-${idp}`}>Entrega prevista</Label>
          <Input id={`dueDate-${idp}`} name="dueDate" type="date" defaultValue={v.dueDate ?? project?.due_date ?? ''} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`url-${idp}`}>Link do projeto / ambiente de testes (opcional)</Label>
        <Input id={`url-${idp}`} name="url" placeholder="https://…" defaultValue={v.url ?? project?.url} />
        <FieldError id={`url-${idp}`} message={errors.url} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`note-${idp}`}>Nota de progresso para o cliente (opcional)</Label>
        <Textarea id={`note-${idp}`} name="note" rows={2} maxLength={500} placeholder="Ex.: Terminámos os testes de pagamento, a preparar o deploy." defaultValue={v.note} />
        <p className="text-xs text-muted-foreground">Fica guardada no histórico de atividade, visível ao cliente. Mudanças de etapa, progresso e data ficam registadas sozinhas.</p>
      </div>
      <Submit pending={pending}>{project ? 'Guardar projeto' : 'Criar projeto'}</Submit>
      <Feedback state={state} />
    </form>
  )
}
