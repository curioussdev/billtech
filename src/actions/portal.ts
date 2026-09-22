'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { requireAdmin, requireSuperAdminForAction, requireUser } from '@/lib/auth'
import { notifyAdminClientReply, notifyAdminNewRequest, notifyClientReply, notifyClientStatus } from '@/lib/portal/notify'
import { OPEN_STATUSES, projectStageLabels, requestStatusLabels } from '@/lib/portal/labels'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { PROJECT_STAGES, REQUEST_PRIORITIES, REQUEST_STATUSES, REQUEST_TYPES, type PortalRequest, type ProjectStage } from '@/types/portal'

export type PortalFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string>
  values?: Record<string, string>
}

const read = (fd: FormData, key: string) => {
  const v = fd.get(key)
  return typeof v === 'string' ? v : ''
}

function fieldErrorsOf(error: z.ZodError) {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(z.flattenError(error).fieldErrors)) out[k] = (v as string[])[0]
  return out
}

const HOUR_AGO = () => new Date(Date.now() - 3_600_000).toISOString()

/**
 * Liga os anexos já carregados (mas ainda sem mensagem) à mensagem que acabou de ser enviada.
 * `attachmentIdsRaw` vem de um campo escondido do formulário, em JSON — inválido ou vazio é ignorado
 * em silêncio (a mensagem já foi enviada; um anexo por ligar não deve fazer a resposta falhar). O
 * `.eq('request_id', requestId)` impede ligar um anexo de outro pedido, mesmo que o id fosse forjado.
 */
async function linkPendingAttachments(db: ReturnType<typeof createAdminClient>, requestId: string, messageId: string, attachmentIdsRaw: string) {
  let raw: unknown
  try {
    raw = JSON.parse(attachmentIdsRaw || '[]')
  } catch {
    return
  }
  const parsed = z.array(z.uuid()).max(10).safeParse(raw)
  if (!parsed.success || parsed.data.length === 0) return
  await db.from('request_attachments').update({ message_id: messageId }).eq('request_id', requestId).in('id', parsed.data).is('message_id', null)
}

// ─── Cliente ────────────────────────────────────────────────────────────────

const newRequestSchema = z.object({
  type: z.enum(REQUEST_TYPES, 'Escolha o tipo de pedido.'),
  priority: z.enum(REQUEST_PRIORITIES),
  projectId: z.union([z.uuid(), z.literal('')]),
  title: z.string().trim().min(5, 'Dê um título com pelo menos 5 caracteres.').max(120, 'Máximo de 120 caracteres.'),
  description: z.string().trim().min(10, 'Descreva o pedido com pelo menos 10 caracteres.').max(4000, 'Máximo de 4000 caracteres.'),
})

export async function createRequest(_prev: PortalFormState, formData: FormData): Promise<PortalFormState> {
  const profile = await requireUser()
  const values = { type: read(formData, 'type'), priority: read(formData, 'priority') || 'normal', projectId: read(formData, 'projectId'), title: read(formData, 'title'), description: read(formData, 'description') }

  const parsed = newRequestSchema.safeParse(values)
  if (!parsed.success) return { status: 'error', message: 'Corrija os campos assinalados.', fieldErrors: fieldErrorsOf(parsed.error), values }

  const db = createAdminClient()

  // Limite anti-abuso: no máximo 10 pedidos por hora
  const { count } = await db.from('requests').select('id', { count: 'exact', head: true }).eq('client_id', profile.id).gte('created_at', HOUR_AGO())
  if ((count ?? 0) >= 10) return { status: 'error', message: 'Enviou muitos pedidos numa hora. Tente novamente daqui a pouco.', values }

  // O projeto tem de pertencer a este cliente
  if (parsed.data.projectId) {
    const { data: project } = await db.from('client_projects').select('id').eq('id', parsed.data.projectId).eq('client_id', profile.id).maybeSingle()
    if (!project) return { status: 'error', message: 'Projeto inválido.', values }
  }

  const { data, error } = await db
    .from('requests')
    .insert({
      client_id: profile.id,
      project_id: parsed.data.projectId || null,
      type: parsed.data.type,
      priority: parsed.data.priority,
      title: parsed.data.title,
      description: parsed.data.description,
      admin_unread: true,
      client_unread: false,
    })
    .select('*')
    .single()
  if (error || !data) {
    console.error('[portal] createRequest:', error)
    return { status: 'error', message: 'Não foi possível enviar o pedido. Tente novamente.', values }
  }

  await notifyAdminNewRequest(data as PortalRequest, profile.full_name || profile.email, profile.email)
  revalidatePath('/area-cliente', 'layout')
  redirect(`/area-cliente/pedidos/${data.id}?novo=1`)
}

const replySchema = z.object({ requestId: z.uuid(), body: z.string().trim().min(1, 'Escreva a sua mensagem.').max(4000, 'Máximo de 4000 caracteres.') })

export async function replyToRequest(_prev: PortalFormState, formData: FormData): Promise<PortalFormState> {
  const profile = await requireUser()
  const parsed = replySchema.safeParse({ requestId: read(formData, 'requestId'), body: read(formData, 'body') })
  if (!parsed.success) return { status: 'error', message: fieldErrorsOf(parsed.error).body ?? 'Pedido inválido.' }

  const db = createAdminClient()
  const { data: request } = await db.from('requests').select('*').eq('id', parsed.data.requestId).eq('client_id', profile.id).maybeSingle()
  if (!request) return { status: 'error', message: 'Pedido não encontrado.' }
  if (request.status === 'cancelado') return { status: 'error', message: 'Este pedido foi cancelado. Abra um novo pedido.' }

  const { count } = await db.from('request_messages').select('id', { count: 'exact', head: true }).eq('author_id', profile.id).gte('created_at', HOUR_AGO())
  if ((count ?? 0) >= 30) return { status: 'error', message: 'Enviou muitas mensagens numa hora. Aguarde um pouco.' }

  const { data: message, error } = await db.from('request_messages').insert({ request_id: request.id, author_id: profile.id, author_role: 'client', body: parsed.data.body }).select('id').single()
  if (error || !message) return { status: 'error', message: 'Não foi possível enviar a mensagem.' }
  await linkPendingAttachments(db, request.id, message.id, read(formData, 'attachmentIds'))

  // Responder a um pedido que aguardava o cliente retoma a análise; responder a um concluído reabre-o
  const status = request.status === 'aguarda_cliente' ? 'em_analise' : request.status === 'concluido' ? 'aberto' : request.status
  const now = new Date().toISOString()
  await db.from('requests').update({ admin_unread: true, status, last_message_at: now, updated_at: now }).eq('id', request.id)

  await notifyAdminClientReply(request as PortalRequest, profile.full_name || profile.email, profile.email, parsed.data.body)
  revalidatePath(`/area-cliente/pedidos/${request.id}`)
  return { status: 'success', message: 'Mensagem enviada.' }
}

export async function cancelRequest(formData: FormData) {
  const profile = await requireUser()
  const id = z.uuid().safeParse(read(formData, 'requestId'))
  if (!id.success) return

  const db = createAdminClient()
  const { data: request } = await db.from('requests').select('id, status').eq('id', id.data).eq('client_id', profile.id).maybeSingle()
  if (!request || !OPEN_STATUSES.includes(request.status)) return

  const now = new Date().toISOString()
  await db.from('requests').update({ status: 'cancelado', admin_unread: true, last_message_at: now, updated_at: now }).eq('id', id.data)
  await db.from('request_messages').insert({ request_id: id.data, author_id: profile.id, author_role: 'client', body: 'Pedido cancelado pelo cliente.' })
  revalidatePath('/area-cliente', 'layout')
}

const satisfactionSchema = z.object({ requestId: z.uuid(), rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().max(500).optional() })

export type SatisfactionResult = { ok: true } | { ok: false; message: string }

/** Satisfação pós-pedido: só depois de "concluído", e só uma vez — não há como voltar a avaliar por cima. */
export async function submitSatisfaction(input: unknown): Promise<SatisfactionResult> {
  const profile = await requireUser()
  const parsed = satisfactionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Avaliação inválida.' }

  const db = createAdminClient()
  const { data: request } = await db.from('requests').select('id, status, satisfaction_rating, title').eq('id', parsed.data.requestId).eq('client_id', profile.id).maybeSingle()
  if (!request) return { ok: false, message: 'Pedido não encontrado.' }
  if (request.status !== 'concluido') return { ok: false, message: 'Só pode avaliar pedidos já concluídos.' }
  if (request.satisfaction_rating !== null) return { ok: false, message: 'Já avaliou este pedido.' }

  const { error } = await db
    .from('requests')
    .update({ satisfaction_rating: parsed.data.rating, satisfaction_comment: parsed.data.comment ?? '', satisfaction_at: new Date().toISOString() })
    .eq('id', request.id)
  if (error) return { ok: false, message: 'Não foi possível guardar a avaliação.' }

  revalidatePath(`/area-cliente/pedidos/${request.id}`)
  revalidatePath(`/admin/pedidos/${request.id}`)
  return { ok: true }
}

/**
 * Limpa o "por ler" do lado de quem abriu a conversa.
 * Verifica sempre a sessão aqui dentro — os dois sítios que chamam isto já confirmavam o dono antes
 * de chegar aqui, mas uma Server Action é um endpoint por si só, alcançável diretamente; sem esta
 * verificação, qualquer pessoa podia limpar o "por ler" de um pedido que não é seu.
 */
export async function markRequestRead(requestId: string, side: 'client' | 'admin') {
  const db = createAdminClient()
  if (side === 'admin') {
    await requireAdmin()
    await db.from('requests').update({ admin_unread: false }).eq('id', requestId)
    return
  }
  const profile = await requireUser()
  await db.from('requests').update({ client_unread: false }).eq('id', requestId).eq('client_id', profile.id)
}

const profileSchema = z.object({ fullName: z.string().trim().min(2, 'Indique o seu nome.').max(100), company: z.string().trim().max(120) })

export async function updateProfile(_prev: PortalFormState, formData: FormData): Promise<PortalFormState> {
  const profile = await requireUser()
  const values = { fullName: read(formData, 'fullName'), company: read(formData, 'company') }
  const parsed = profileSchema.safeParse(values)
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsOf(parsed.error), values }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ full_name: parsed.data.fullName, company: parsed.data.company }).eq('id', profile.id)
  if (error) return { status: 'error', message: 'Não foi possível guardar.', values }
  revalidatePath('/area-cliente', 'layout')
  return { status: 'success', message: 'Dados atualizados.', values }
}

// ─── Administração ──────────────────────────────────────────────────────────

const adminReplySchema = z.object({ requestId: z.uuid(), body: z.string().trim().min(1, 'Escreva a mensagem.').max(4000) })

export async function adminReply(_prev: PortalFormState, formData: FormData): Promise<PortalFormState> {
  const admin = await requireAdmin()
  const parsed = adminReplySchema.safeParse({ requestId: read(formData, 'requestId'), body: read(formData, 'body') })
  if (!parsed.success) return { status: 'error', message: fieldErrorsOf(parsed.error).body ?? 'Pedido inválido.' }
  const internal = read(formData, 'internal') === 'on'

  const db = createAdminClient()
  const { data: request } = await db.from('requests').select('*').eq('id', parsed.data.requestId).maybeSingle()
  if (!request) return { status: 'error', message: 'Pedido não encontrado.' }

  const { data: message, error } = await db.from('request_messages').insert({ request_id: request.id, author_id: admin.id, author_role: 'admin', body: parsed.data.body, internal }).select('id').single()
  if (error || !message) return { status: 'error', message: 'Não foi possível enviar.' }
  await linkPendingAttachments(db, request.id, message.id, read(formData, 'attachmentIds'))

  const now = new Date().toISOString()
  const update: Record<string, unknown> = { last_message_at: now, updated_at: now }
  if (!internal) {
    update.client_unread = true
    if (request.status === 'aberto') update.status = 'em_analise'
  }
  await db.from('requests').update(update).eq('id', request.id)

  if (!internal) {
    const { data: client } = await db.from('profiles').select('email, full_name').eq('id', request.client_id).single()
    if (client) await notifyClientReply(request as PortalRequest, client.email, client.full_name, parsed.data.body)
  }
  await logAudit({
    admin,
    action: internal ? 'ADD_INTERNAL_NOTE' : 'REPLY_REQUEST',
    resource: 'pedidos',
    targetId: request.id,
    details: { title: request.title, clientId: request.client_id, internal, excerpt: parsed.data.body.slice(0, 300), length: parsed.data.body.length },
  })
  revalidatePath(`/admin/pedidos/${request.id}`)
  return { status: 'success', message: internal ? 'Nota interna guardada.' : 'Resposta enviada ao cliente.' }
}

const metaSchema = z.object({ requestId: z.uuid(), status: z.enum(REQUEST_STATUSES), priority: z.enum(REQUEST_PRIORITIES) })

export async function updateRequestMeta(_prev: PortalFormState, formData: FormData): Promise<PortalFormState> {
  const admin = await requireAdmin()
  const parsed = metaSchema.safeParse({ requestId: read(formData, 'requestId'), status: read(formData, 'status'), priority: read(formData, 'priority') })
  if (!parsed.success) return { status: 'error', message: 'Valores inválidos.' }

  const db = createAdminClient()
  const { data: request } = await db.from('requests').select('*').eq('id', parsed.data.requestId).maybeSingle()
  if (!request) return { status: 'error', message: 'Pedido não encontrado.' }

  const statusChanged = request.status !== parsed.data.status
  const now = new Date().toISOString()
  await db.from('requests').update({ status: parsed.data.status, priority: parsed.data.priority, updated_at: now, ...(statusChanged ? { client_unread: true, last_message_at: now } : {}) }).eq('id', request.id)

  if (statusChanged) {
    await db.from('request_messages').insert({ request_id: request.id, author_id: admin.id, author_role: 'admin', body: `Estado alterado para «${requestStatusLabels[parsed.data.status]}».` })
    const { data: client } = await db.from('profiles').select('email').eq('id', request.client_id).single()
    if (client) await notifyClientStatus(request as PortalRequest, client.email, parsed.data.status)
  }
  await logAudit({
    admin,
    action: 'UPDATE_REQUEST',
    resource: 'pedidos',
    targetId: request.id,
    details: { title: request.title, clientId: request.client_id, before: { status: request.status, priority: request.priority }, after: { status: parsed.data.status, priority: parsed.data.priority } },
  })
  revalidatePath('/admin/pedidos', 'layout')
  return { status: 'success', message: 'Pedido atualizado.' }
}

const projectSchema = z.object({
  id: z.union([z.uuid(), z.literal('')]),
  clientId: z.uuid(),
  name: z.string().trim().min(2, 'Indique o nome do projeto.').max(120),
  description: z.string().trim().max(1000),
  status: z.enum(PROJECT_STAGES),
  progress: z.coerce.number().int().min(0, '0 a 100').max(100, '0 a 100'),
  dueDate: z.union([z.iso.date(), z.literal('')]),
  url: z.string().trim().max(500).refine((v) => v === '' || /^https?:\/\//i.test(v), 'Use um link http(s)://'),
  /** Nota de progresso opcional — fica no histórico de atividade do projeto, visível ao cliente. */
  note: z.string().trim().max(500).optional(),
})

export async function saveClientProject(_prev: PortalFormState, formData: FormData): Promise<PortalFormState> {
  const admin = await requireAdmin()
  const values = Object.fromEntries(['id', 'clientId', 'name', 'description', 'status', 'progress', 'dueDate', 'url', 'note'].map((k) => [k, read(formData, k)]))
  const parsed = projectSchema.safeParse(values)
  if (!parsed.success) return { status: 'error', message: 'Corrija os campos assinalados.', fieldErrors: fieldErrorsOf(parsed.error), values }

  const { id, clientId, dueDate, note, ...rest } = parsed.data
  const row = { client_id: clientId, name: rest.name, description: rest.description, status: rest.status, progress: rest.progress, due_date: dueDate || null, url: rest.url, updated_at: new Date().toISOString() }

  const supabase = await createClient()
  const { data: before } = id ? await supabase.from('client_projects').select('*').eq('id', id).maybeSingle() : { data: null }
  const { data: saved, error } = id
    ? await supabase.from('client_projects').update(row).eq('id', id).select('id').single()
    : await supabase.from('client_projects').insert(row).select('id').single()
  if (error) return { status: 'error', message: `Não foi possível guardar: ${error.message}`, values }

  const projectId = saved?.id ?? id
  await logAudit({ admin, action: id ? 'UPDATE_CLIENT_PROJECT' : 'CREATE_CLIENT_PROJECT', resource: 'projetos_cliente', targetId: projectId, details: { clientId, before, after: row } })

  // Histórico de atividade: regista sozinho o que mudou, mais a nota manual do admin, se houver.
  const events: { project_id: string; kind: 'status' | 'progress' | 'due_date' | 'nota'; message: string; created_by: string }[] = []
  if (!before) {
    events.push({ project_id: projectId, kind: 'status', message: `Projeto criado — etapa inicial: ${projectStageLabels[row.status]}.`, created_by: admin.id })
  } else {
    if (before.status !== row.status) events.push({ project_id: projectId, kind: 'status', message: `Etapa alterada de «${projectStageLabels[before.status as ProjectStage]}» para «${projectStageLabels[row.status]}».`, created_by: admin.id })
    if (before.progress !== row.progress) events.push({ project_id: projectId, kind: 'progress', message: `Progresso atualizado para ${row.progress}%.`, created_by: admin.id })
    if (before.due_date !== row.due_date) events.push({ project_id: projectId, kind: 'due_date', message: row.due_date ? `Nova data de entrega: ${row.due_date}.` : 'Data de entrega removida.', created_by: admin.id })
  }
  if (note) events.push({ project_id: projectId, kind: 'nota', message: note, created_by: admin.id })
  if (events.length > 0) await supabase.from('client_project_events').insert(events)

  revalidatePath(`/admin/clientes/${clientId}`)
  revalidatePath('/area-cliente', 'layout')
  return { status: 'success', message: id ? 'Projeto atualizado.' : 'Projeto criado.', values: id ? values : {} }
}

export async function deleteClientProject(formData: FormData) {
  const admin = await requireSuperAdminForAction({ action: 'DELETE_CLIENT_PROJECT', resource: 'projetos_cliente' })
  if (!admin) return
  const id = z.uuid().safeParse(read(formData, 'id'))
  if (!id.success) return
  const supabase = await createClient()
  const { data: before } = await supabase.from('client_projects').select('*').eq('id', id.data).maybeSingle()
  const { error } = await supabase.from('client_projects').delete().eq('id', id.data)
  if (error) return
  await logAudit({ admin, action: 'DELETE_CLIENT_PROJECT', resource: 'projetos_cliente', targetId: id.data, details: { clientId: before?.client_id, before } })
  revalidatePath('/admin/clientes', 'layout')
  revalidatePath('/area-cliente', 'layout')
}
