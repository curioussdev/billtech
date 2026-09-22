'use server'

import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { requireAdmin, requireUser } from '@/lib/auth'
import { CLIENT_ATTACHMENTS_BUCKET } from '@/lib/supabase/config'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Documentos do projeto (contratos, acessos, entregáveis) — só o admin carrega, o cliente só
 * descarrega. Reutiliza o bucket privado `client-attachments`, com o prefixo "projects/<id>/…" (a
 * política de storage em 010_satisfaction_documents.sql só deixa escrever aí quem é admin).
 */

const recordSchema = z.object({
  projectId: z.uuid(),
  storagePath: z.string().trim().min(1).max(500),
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().max(120),
  sizeBytes: z.coerce.number().int().min(0).max(10 * 1024 * 1024),
})

export type DocumentResult = { ok: true; documentId: string } | { ok: false; message: string }

export async function recordProjectDocument(input: unknown): Promise<DocumentResult> {
  const admin = await requireAdmin()
  const parsed = recordSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Documento inválido.' }
  if (!parsed.data.storagePath.startsWith(`projects/${parsed.data.projectId}/`)) return { ok: false, message: 'Caminho de ficheiro inválido.' }

  const db = createAdminClient()
  const { data, error } = await db
    .from('project_documents')
    .insert({ project_id: parsed.data.projectId, storage_path: parsed.data.storagePath, file_name: parsed.data.fileName, content_type: parsed.data.contentType, size_bytes: parsed.data.sizeBytes, uploaded_by: admin.id })
    .select('id')
    .single()
  if (error || !data) return { ok: false, message: 'Não foi possível registar o documento.' }

  await logAudit({ admin, action: 'UPLOAD_PROJECT_DOCUMENT', resource: 'projetos_cliente', targetId: parsed.data.projectId, details: { document: parsed.data.fileName } })
  return { ok: true, documentId: data.id }
}

const deleteSchema = z.object({ documentId: z.uuid() })

export async function deleteProjectDocument(input: unknown): Promise<DocumentResult> {
  const admin = await requireAdmin()
  const parsed = deleteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' }

  const db = createAdminClient()
  const { data: doc } = await db.from('project_documents').select('*').eq('id', parsed.data.documentId).maybeSingle()
  if (!doc) return { ok: true, documentId: parsed.data.documentId }

  await db.storage.from(CLIENT_ATTACHMENTS_BUCKET).remove([doc.storage_path])
  await db.from('project_documents').delete().eq('id', doc.id)
  await logAudit({ admin, action: 'DELETE_PROJECT_DOCUMENT', resource: 'projetos_cliente', targetId: doc.project_id, details: { removedDocument: doc.file_name } })
  return { ok: true, documentId: doc.id }
}

const urlSchema = z.object({ documentId: z.uuid() })

export type DocumentUrlResult = { ok: true; url: string; fileName: string } | { ok: false; message: string }

export async function getProjectDocumentUrl(input: unknown): Promise<DocumentUrlResult> {
  const profile = await requireUser()
  const parsed = urlSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' }

  const db = createAdminClient()
  const { data: doc } = await db.from('project_documents').select('*').eq('id', parsed.data.documentId).maybeSingle()
  if (!doc) return { ok: false, message: 'Documento não encontrado.' }

  if (profile.role !== 'admin') {
    const { data: project } = await db.from('client_projects').select('client_id').eq('id', doc.project_id).maybeSingle()
    if (!project || project.client_id !== profile.id) return { ok: false, message: 'Sem acesso a este documento.' }
  }

  const { data: signed, error } = await db.storage.from(CLIENT_ATTACHMENTS_BUCKET).createSignedUrl(doc.storage_path, 60)
  if (error || !signed) return { ok: false, message: 'Não foi possível gerar o link.' }
  return { ok: true, url: signed.signedUrl, fileName: doc.file_name }
}
