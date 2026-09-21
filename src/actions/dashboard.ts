'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { defaultProjects } from '@/data/projects'
import { requireAdmin } from '@/lib/auth'
import { contentSchemas, projectSchema, type ContentKey } from '@/lib/content/schema'
import { createClient } from '@/lib/supabase/server'

export type SaveResult = { ok: true; message: string } | { ok: false; message: string; issues?: string[] }

const formatIssues = (error: z.ZodError) => error.issues.map((i) => `${i.path.join(' › ') || 'geral'}: ${i.message}`)

/** Invalida a landing, as páginas de projeto, o sitemap e o layout. */
const refreshSite = () => revalidatePath('/', 'layout')

// Todas as ações repetem requireAdmin(): Server Actions são endpoints POST públicos.
// A RLS do Supabase é a segunda barreira (só is_admin() pode escrever).

export async function saveContent(key: ContentKey, value: unknown): Promise<SaveResult> {
  await requireAdmin()
  const schema = contentSchemas[key]
  if (!schema) return { ok: false, message: 'Secção desconhecida.' }

  const parsed = schema.safeParse(value)
  if (!parsed.success) return { ok: false, message: 'Corrija os campos indicados.', issues: formatIssues(parsed.error) }

  if (key === 'solutions') {
    const ids = (parsed.data as { items: { id: string }[] }).items.map((i) => i.id)
    if (new Set(ids).size !== ids.length) return { ok: false, message: 'Os identificadores das soluções têm de ser únicos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('site_content').upsert({ key, value: parsed.data, updated_at: new Date().toISOString() })
  if (error) return { ok: false, message: `Não foi possível guardar: ${error.message}` }

  refreshSite()
  return { ok: true, message: 'Alterações guardadas e publicadas.' }
}

export async function saveProject(id: string | null, value: unknown): Promise<SaveResult & { created?: boolean }> {
  await requireAdmin()
  const parsed = projectSchema.safeParse(value)
  if (!parsed.success) return { ok: false, message: 'Corrija os campos indicados.', issues: formatIssues(parsed.error) }

  const supabase = await createClient()
  const { slug, published } = parsed.data

  if (id) {
    const { error } = await supabase.from('projects').update({ slug, published, data: parsed.data, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return { ok: false, message: error.code === '23505' ? 'Já existe um projeto com esse endereço (slug).' : `Não foi possível guardar: ${error.message}` }
    refreshSite()
    return { ok: true, message: 'Projeto guardado.' }
  }

  const { data: last } = await supabase.from('projects').select('position').order('position', { ascending: false }).limit(1)
  const position = (last?.[0]?.position ?? -1) + 1
  const { error } = await supabase.from('projects').insert({ slug, published, position, data: parsed.data })
  if (error) return { ok: false, message: error.code === '23505' ? 'Já existe um projeto com esse endereço (slug).' : `Não foi possível criar: ${error.message}` }

  refreshSite()
  return { ok: true, message: 'Projeto criado.', created: true }
}

export async function deleteProject(formData: FormData) {
  await requireAdmin()
  const id = z.uuid().safeParse(formData.get('id'))
  if (!id.success) return
  const supabase = await createClient()
  await supabase.from('projects').delete().eq('id', id.data)
  refreshSite()
}

export async function moveProject(formData: FormData) {
  await requireAdmin()
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
  refreshSite()
}

/** Cria na base de dados os projetos de exemplo (editáveis a partir daí). */
export async function seedProjects() {
  await requireAdmin()
  const supabase = await createClient()
  const { count } = await supabase.from('projects').select('id', { count: 'exact', head: true })
  if (count) return
  await supabase.from('projects').insert(defaultProjects.map((p, position) => ({ slug: p.slug, published: p.published, position, data: p })))
  refreshSite()
}

const emailSchema = z.email('Indique um email válido.')

export async function saveContactEmail(_prev: SaveResult | null, formData: FormData): Promise<SaveResult> {
  await requireAdmin()
  const parsed = emailSchema.safeParse(String(formData.get('email') ?? '').trim())
  if (!parsed.success) return { ok: false, message: 'Indique um email válido.' }

  const supabase = await createClient()
  const { error } = await supabase.from('private_settings').upsert({ key: 'contact_email', value: parsed.data })
  if (error) return { ok: false, message: `Não foi possível guardar: ${error.message}` }
  return { ok: true, message: 'Email de receção atualizado.' }
}

export async function saveClientSolutions(userId: string, solutionIds: string[]): Promise<SaveResult> {
  await requireAdmin()
  const parsedId = z.uuid().safeParse(userId)
  const parsedIds = z.array(z.string().max(60)).max(100).safeParse(solutionIds)
  if (!parsedId.success || !parsedIds.success) return { ok: false, message: 'Pedido inválido.' }

  const supabase = await createClient()
  const { error: delError } = await supabase.from('client_solutions').delete().eq('user_id', parsedId.data)
  if (delError) return { ok: false, message: `Não foi possível guardar: ${delError.message}` }

  if (parsedIds.data.length > 0) {
    const { error } = await supabase.from('client_solutions').insert(parsedIds.data.map((solution_id) => ({ user_id: parsedId.data, solution_id })))
    if (error) return { ok: false, message: `Não foi possível guardar: ${error.message}` }
  }
  return { ok: true, message: 'Acessos atualizados.' }
}
