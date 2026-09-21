'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { defaultContent } from '@/data/defaults'
import { defaultProjects } from '@/data/projects'
import { logAudit } from '@/lib/audit'
import { FORBIDDEN_MESSAGE, requireAdmin, requireSuperAdminForAction } from '@/lib/auth'
import { contentSchemas, projectSchema, type ContentKey } from '@/lib/content/schema'
import { createClient } from '@/lib/supabase/server'

export type SaveResult = { ok: true; message: string } | { ok: false; message: string; issues?: string[] }

const formatIssues = (error: z.ZodError) => error.issues.map((i) => `${i.path.join(' › ') || 'geral'}: ${i.message}`)
const forbidden = (): SaveResult => ({ ok: false, message: FORBIDDEN_MESSAGE })

/** Invalida a landing, as páginas de projeto, o sitemap e o layout. */
const refreshSite = () => revalidatePath('/', 'layout')

// Todas as ações repetem a verificação de admin: Server Actions são endpoints POST públicos.
// A RLS do Supabase é a segunda barreira. As ações críticas exigem Super Admin (whitelist).
// Toda a ação bem-sucedida grava em audit_logs (quem, o quê, onde, quando).

/** Secções de configuração global: só Super Admins. */
const GLOBAL_CONTENT_KEYS: ContentKey[] = ['general', 'solutions']

export async function saveContent(key: ContentKey, value: unknown): Promise<SaveResult> {
  const admin = GLOBAL_CONTENT_KEYS.includes(key) ? await requireSuperAdminForAction({ action: 'UPDATE_CONTENT', resource: `conteudo_landing:${key}` }) : await requireAdmin()
  if (!admin) return forbidden()

  const schema = contentSchemas[key]
  if (!schema) return { ok: false, message: 'Secção desconhecida.' }

  const parsed = schema.safeParse(value)
  if (!parsed.success) return { ok: false, message: 'Corrija os campos indicados.', issues: formatIssues(parsed.error) }

  if (key === 'solutions') {
    const ids = (parsed.data as { items: { id: string }[] }).items.map((i) => i.id)
    if (new Set(ids).size !== ids.length) return { ok: false, message: 'Os identificadores das soluções têm de ser únicos.' }
  }

  const supabase = await createClient()
  const { data: existing } = await supabase.from('site_content').select('value').eq('key', key).maybeSingle()
  const before = existing?.value ?? defaultContent[key]

  const { error } = await supabase.from('site_content').upsert({ key, value: parsed.data, updated_at: new Date().toISOString() })
  if (error) return { ok: false, message: `Não foi possível guardar: ${error.message}` }

  await logAudit({ admin, action: 'UPDATE_CONTENT', resource: 'conteudo_landing', targetId: key, details: { section: key, before, after: parsed.data } })
  refreshSite()
  return { ok: true, message: 'Alterações guardadas e publicadas.' }
}

export async function saveProject(id: string | null, value: unknown): Promise<SaveResult & { created?: boolean }> {
  const admin = await requireAdmin()
  const parsed = projectSchema.safeParse(value)
  if (!parsed.success) return { ok: false, message: 'Corrija os campos indicados.', issues: formatIssues(parsed.error) }

  const supabase = await createClient()
  const { slug, published } = parsed.data

  if (id) {
    const { data: before } = await supabase.from('projects').select('slug, published, data').eq('id', id).maybeSingle()
    const { error } = await supabase.from('projects').update({ slug, published, data: parsed.data, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return { ok: false, message: error.code === '23505' ? 'Já existe um projeto com esse endereço (slug).' : `Não foi possível guardar: ${error.message}` }
    await logAudit({ admin, action: 'UPDATE_PROJECT', resource: 'projetos_cases', targetId: id, details: { slug, before, after: parsed.data } })
    refreshSite()
    return { ok: true, message: 'Projeto guardado.' }
  }

  const { data: last } = await supabase.from('projects').select('position').order('position', { ascending: false }).limit(1)
  const position = (last?.[0]?.position ?? -1) + 1
  const { data: created, error } = await supabase.from('projects').insert({ slug, published, position, data: parsed.data }).select('id').single()
  if (error) return { ok: false, message: error.code === '23505' ? 'Já existe um projeto com esse endereço (slug).' : `Não foi possível criar: ${error.message}` }

  await logAudit({ admin, action: 'CREATE_PROJECT', resource: 'projetos_cases', targetId: created?.id, details: { slug, after: parsed.data } })
  refreshSite()
  return { ok: true, message: 'Projeto criado.', created: true }
}

export async function deleteProject(formData: FormData) {
  const admin = await requireSuperAdminForAction({ action: 'DELETE_PROJECT', resource: 'projetos_cases' })
  if (!admin) return
  const id = z.uuid().safeParse(formData.get('id'))
  if (!id.success) return

  const supabase = await createClient()
  const { data: before } = await supabase.from('projects').select('slug, published, position, data').eq('id', id.data).maybeSingle()
  const { error } = await supabase.from('projects').delete().eq('id', id.data)
  if (error) return

  await logAudit({ admin, action: 'DELETE_PROJECT', resource: 'projetos_cases', targetId: id.data, details: { before } })
  refreshSite()
}

export async function moveProject(formData: FormData) {
  const admin = await requireAdmin()
  const id = z.uuid().safeParse(formData.get('id'))
  const direction = formData.get('direction') === 'up' ? -1 : 1
  if (!id.success) return

  const supabase = await createClient()
  const { data } = await supabase.from('projects').select('id').order('position', { ascending: true })
  const ids = (data ?? []).map((r) => r.id as string)
  const from = ids.indexOf(id.data)
  const to = from + direction
  if (from < 0 || to < 0 || to >= ids.length) return

  ids.splice(to, 0, ids.splice(from, 1)[0])
  await Promise.all(ids.map((rowId, position) => supabase.from('projects').update({ position }).eq('id', rowId)))
  await logAudit({ admin, action: 'REORDER_PROJECT', resource: 'projetos_cases', targetId: id.data, details: { from, to, direction: direction === -1 ? 'up' : 'down' } })
  refreshSite()
}

/** Cria na base de dados os projetos de exemplo (editáveis a partir daí). */
export async function seedProjects() {
  const admin = await requireAdmin()
  const supabase = await createClient()
  const { count } = await supabase.from('projects').select('id', { count: 'exact', head: true })
  if (count) return
  const { error } = await supabase.from('projects').insert(defaultProjects.map((p, position) => ({ slug: p.slug, published: p.published, position, data: p })))
  if (error) return
  await logAudit({ admin, action: 'SEED_PROJECTS', resource: 'projetos_cases', details: { imported: defaultProjects.map((p) => p.slug) } })
  refreshSite()
}

/** Regista um carregamento de imagem (feito direto do browser para o Storage, sem passar por outra ação). */
export async function auditMediaUpload(path: string, bytes: number): Promise<void> {
  const admin = await requireAdmin()
  if (!/^[a-z0-9-]+\/[A-Za-z0-9-]+\.[a-z0-9]{2,5}$/.test(path)) return
  await logAudit({ admin, action: 'UPLOAD_MEDIA', resource: 'media', targetId: path, details: { bucket: 'site-media', path, bytes: Math.max(0, Math.floor(bytes)) } })
}

const emailSchema = z.email('Indique um email válido.')

export async function saveContactEmail(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireSuperAdminForAction({ action: 'UPDATE_CONTACT_EMAIL', resource: 'definicoes' })
  if (!admin) return forbidden()

  const parsed = emailSchema.safeParse(String(formData.get('email') ?? '').trim())
  if (!parsed.success) return { ok: false, message: 'Indique um email válido.' }

  const supabase = await createClient()
  const { data: before } = await supabase.from('private_settings').select('value').eq('key', 'contact_email').maybeSingle()
  const { error } = await supabase.from('private_settings').upsert({ key: 'contact_email', value: parsed.data })
  if (error) return { ok: false, message: `Não foi possível guardar: ${error.message}` }

  await logAudit({ admin, action: 'UPDATE_CONTACT_EMAIL', resource: 'definicoes', targetId: 'contact_email', details: { before: before?.value ?? null, after: parsed.data } })
  return { ok: true, message: 'Email de receção atualizado.' }
}

/** Concessão/revogação de acesso a soluções: é uma alteração de permissões → Super Admin. */
export async function saveClientSolutions(userId: string, solutionIds: string[]): Promise<SaveResult> {
  const admin = await requireSuperAdminForAction({ action: 'GRANT_PERMISSION', resource: 'permissoes_cliente' })
  if (!admin) return forbidden()

  const parsedId = z.uuid().safeParse(userId)
  const parsedIds = z.array(z.string().max(60)).max(100).safeParse(solutionIds)
  if (!parsedId.success || !parsedIds.success) return { ok: false, message: 'Pedido inválido.' }

  const supabase = await createClient()
  const { data: current } = await supabase.from('client_solutions').select('solution_id').eq('user_id', parsedId.data)
  const before = (current ?? []).map((r) => r.solution_id as string).sort()
  const after = [...new Set(parsedIds.data)].sort()

  const { error: delError } = await supabase.from('client_solutions').delete().eq('user_id', parsedId.data)
  if (delError) return { ok: false, message: `Não foi possível guardar: ${delError.message}` }

  if (after.length > 0) {
    const { error } = await supabase.from('client_solutions').insert(after.map((solution_id) => ({ user_id: parsedId.data, solution_id })))
    if (error) return { ok: false, message: `Não foi possível guardar: ${error.message}` }
  }

  await logAudit({
    admin,
    action: 'GRANT_PERMISSION',
    resource: 'permissoes_cliente',
    targetId: parsedId.data,
    details: { before, after, granted: after.filter((s) => !before.includes(s)), revoked: before.filter((s) => !after.includes(s)) },
  })
  return { ok: true, message: 'Acessos atualizados.' }
}
