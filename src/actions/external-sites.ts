'use server'

import { createHash, randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

const createSchema = z.object({
  clientId: z.uuid('Escolha um cliente.'),
  name: z.string().trim().min(2, 'Indique um nome para o site.').max(120),
  domain: z
    .string()
    .trim()
    .min(3, 'Indique o domínio.')
    .max(200)
    .transform((v) => v.replace(/^https?:\/\//, '').replace(/\/$/, '')),
})

export type CreateExternalSiteResult = { ok: true; apiKey: string } | { ok: false; message: string }

/**
 * Regista um site externo e gera a respetiva chave de API. A chave só existe em claro aqui, no
 * retorno desta ação — na base de dados só fica o hash SHA-256. Se se perder, só resta gerar outra
 * (apagar e recriar o registo nesta Fase 1; a Fase 2 traz "regenerar chave").
 */
export async function createExternalSite(input: unknown): Promise<CreateExternalSiteResult> {
  const admin = await requireAdmin()
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  const apiKey = randomBytes(32).toString('hex')
  const apiKeyHash = createHash('sha256').update(apiKey).digest('hex')

  const db = createAdminClient()
  const { error } = await db.from('external_sites').insert({ client_id: parsed.data.clientId, name: parsed.data.name, domain: parsed.data.domain, api_key_hash: apiKeyHash })
  if (error) return { ok: false, message: 'Não foi possível registar o site.' }

  await logAudit({ admin, action: 'CREATE_EXTERNAL_SITE', resource: 'negocio', details: { domain: parsed.data.domain, clientId: parsed.data.clientId } })
  revalidatePath('/admin/command-center')
  return { ok: true, apiKey }
}

/** Remove o registo de um site externo (e a telemetria associada, por cascade). */
export async function deleteExternalSite(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const id = z.uuid().safeParse(formData.get('id'))
  if (!id.success) return

  const db = createAdminClient()
  const { data: before } = await db.from('external_sites').select('name, domain, client_id').eq('id', id.data).maybeSingle()
  const { error } = await db.from('external_sites').delete().eq('id', id.data)
  if (error) return

  await logAudit({ admin, action: 'DELETE_EXTERNAL_SITE', resource: 'negocio', targetId: id.data, details: { before } })
  revalidatePath('/admin/command-center')
}
