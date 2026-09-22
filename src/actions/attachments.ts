'use server'

import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { CLIENT_ATTACHMENTS_BUCKET } from '@/lib/supabase/config'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Anexos nas conversas dos pedidos. O ficheiro em si sobe diretamente do browser para o Storage
 * (o mesmo padrão já usado em `field-editor.tsx`, só que para um bucket privado) — estas Server
 * Actions só tratam dos metadados: registar depois de subir, e devolver um URL assinado (de curta
 * duração) para descarregar, nunca um URL público, porque o bucket é privado.
 */

export type AttachmentResult = { ok: true; attachmentId: string } | { ok: false; message: string }

const MAX_SIZE_BYTES = 10 * 1024 * 1024

const recordSchema = z.object({
  requestId: z.uuid(),
  storagePath: z.string().trim().min(1).max(500),
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().max(120),
  sizeBytes: z.coerce.number().int().min(0).max(MAX_SIZE_BYTES),
})

/** Chamado depois do upload ter sucesso — grava os metadados, com `message_id` ainda nulo (liga-se à mensagem quando a resposta for enviada, ver `replyToRequest`/`adminReply`). */
export async function recordAttachment(input: unknown): Promise<AttachmentResult> {
  const profile = await requireUser()
  const parsed = recordSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Anexo inválido.' }

  const db = createAdminClient()
  const { data: request } = await db.from('requests').select('id, client_id').eq('id', parsed.data.requestId).maybeSingle()
  if (!request) return { ok: false, message: 'Pedido não encontrado.' }
  if (profile.role !== 'admin' && request.client_id !== profile.id) return { ok: false, message: 'Sem acesso a este pedido.' }
  // A mesma regra que a política do bucket já impõe na escrita — confirmar aqui também evita registos órfãos.
  if (!parsed.data.storagePath.startsWith(`${parsed.data.requestId}/`)) return { ok: false, message: 'Caminho de ficheiro inválido.' }

  const { data, error } = await db
    .from('request_attachments')
    .insert({
      request_id: parsed.data.requestId,
      storage_path: parsed.data.storagePath,
      file_name: parsed.data.fileName,
      content_type: parsed.data.contentType,
      size_bytes: parsed.data.sizeBytes,
      uploaded_by: profile.id,
      uploader_role: profile.role === 'admin' ? 'admin' : 'client',
    })
    .select('id')
    .single()
  if (error || !data) return { ok: false, message: 'Não foi possível registar o anexo.' }
  return { ok: true, attachmentId: data.id }
}

const deleteSchema = z.object({ attachmentId: z.uuid() })

/** Remove um anexo ainda não ligado a nenhuma mensagem (ex.: o utilizador anexou e depois desistiu antes de enviar). */
export async function removePendingAttachment(input: unknown): Promise<AttachmentResult> {
  const profile = await requireUser()
  const parsed = deleteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' }

  const db = createAdminClient()
  const { data: attachment } = await db.from('request_attachments').select('*').eq('id', parsed.data.attachmentId).maybeSingle()
  if (!attachment) return { ok: true, attachmentId: parsed.data.attachmentId } // já não existe — sem drama
  if (attachment.message_id) return { ok: false, message: 'Este anexo já foi enviado numa mensagem.' }
  if (profile.role !== 'admin' && attachment.uploaded_by !== profile.id) return { ok: false, message: 'Sem acesso a este anexo.' }

  await db.storage.from(CLIENT_ATTACHMENTS_BUCKET).remove([attachment.storage_path])
  await db.from('request_attachments').delete().eq('id', attachment.id)
  return { ok: true, attachmentId: attachment.id }
}

const urlSchema = z.object({ attachmentId: z.uuid() })

export type AttachmentUrlResult = { ok: true; url: string; fileName: string } | { ok: false; message: string }

/** URL assinada de 60 segundos — suficiente para o browser abrir/descarregar, sem deixar um link permanente pendurado. */
export async function getAttachmentUrl(input: unknown): Promise<AttachmentUrlResult> {
  const profile = await requireUser()
  const parsed = urlSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Pedido inválido.' }

  const db = createAdminClient()
  const { data: attachment } = await db.from('request_attachments').select('*').eq('id', parsed.data.attachmentId).maybeSingle()
  if (!attachment) return { ok: false, message: 'Anexo não encontrado.' }

  if (profile.role !== 'admin') {
    const { data: request } = await db.from('requests').select('client_id').eq('id', attachment.request_id).maybeSingle()
    if (!request || request.client_id !== profile.id) return { ok: false, message: 'Sem acesso a este anexo.' }
  }

  const { data: signed, error } = await db.storage.from(CLIENT_ATTACHMENTS_BUCKET).createSignedUrl(attachment.storage_path, 60)
  if (error || !signed) return { ok: false, message: 'Não foi possível gerar o link.' }
  return { ok: true, url: signed.signedUrl, fileName: attachment.file_name }
}
