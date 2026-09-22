'use client'

import { useRef, useState } from 'react'
import { Download, FileText, Loader2, Paperclip, X } from 'lucide-react'
import { getAttachmentUrl, recordAttachment, removePendingAttachment } from '@/actions/attachments'
import { createClient } from '@/lib/supabase/client'
import { CLIENT_ATTACHMENTS_BUCKET } from '@/lib/supabase/config'
import type { RequestAttachment } from '@/types/portal'

const MAX_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

type PendingAttachment = { id: string; fileName: string }

/**
 * Anexar ficheiros a uma resposta: sobe direto do browser para o Storage (o mesmo padrão já usado
 * no editor de conteúdo, mas para um bucket privado), regista os metadados, e mostra o anexo como um
 * chip até o formulário ser submetido — os ids seguem num campo escondido (`attachmentIds`) e a
 * Server Action liga-os à mensagem assim que ela for criada.
 */
export function AttachmentUploader({ requestId, name = 'attachmentIds' }: { requestId: string; name?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<PendingAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    for (const file of Array.from(files)) {
      if (file.size > MAX_SIZE_BYTES) {
        setError(`"${file.name}" excede 10 MB.`)
        continue
      }
      setUploading(true)
      try {
        const supabase = createClient()
        const ext = (file.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
        const path = `${requestId}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`
        const { error: uploadError } = await supabase.storage.from(CLIENT_ATTACHMENTS_BUCKET).upload(path, file, { contentType: file.type || 'application/octet-stream' })
        if (uploadError) throw uploadError
        const result = await recordAttachment({ requestId, storagePath: path, fileName: file.name, contentType: file.type, sizeBytes: file.size })
        if (!result.ok) throw new Error(result.message)
        setPending((p) => [...p, { id: result.attachmentId, fileName: file.name }])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Falha ao carregar o ficheiro.')
      } finally {
        setUploading(false)
      }
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeChip(id: string) {
    setPending((p) => p.filter((a) => a.id !== id))
    void removePendingAttachment({ attachmentId: id })
  }

  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={JSON.stringify(pending.map((p) => p.id))} />
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
          {uploading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Paperclip className="size-3.5" aria-hidden />}
          Anexar ficheiro
          <input ref={inputRef} type="file" multiple className="sr-only" accept={ALLOWED_TYPES.join(',')} onChange={(e) => handleFiles(e.target.files)} disabled={uploading} />
        </label>
        {pending.map((p) => (
          <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs">
            <FileText className="size-3.5" aria-hidden />
            <span className="max-w-[10rem] truncate">{p.fileName}</span>
            <button type="button" onClick={() => removeChip(p.id)} aria-label={`Remover ${p.fileName}`} className="text-muted-foreground hover:text-destructive">
              <X className="size-3" aria-hidden />
            </button>
          </span>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">Máx. 10 MB por ficheiro — imagens, PDF, Word ou Excel.</p>
    </div>
  )
}

/** Lista de anexos de uma mensagem — o download passa sempre por um URL assinado de curta duração (o bucket é privado). */
export function AttachmentList({ attachments }: { attachments: RequestAttachment[] }) {
  const [downloading, setDownloading] = useState<string | null>(null)

  async function download(id: string) {
    setDownloading(id)
    const result = await getAttachmentUrl({ attachmentId: id })
    setDownloading(null)
    if (result.ok) window.open(result.url, '_blank', 'noopener,noreferrer')
  }

  if (attachments.length === 0) return null
  return (
    <ul className="mt-2 grid gap-1.5">
      {attachments.map((a) => (
        <li key={a.id}>
          <button type="button" onClick={() => download(a.id)} disabled={downloading === a.id} className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/60 px-2.5 py-1 text-xs font-medium hover:border-primary">
            {downloading === a.id ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Download className="size-3.5" aria-hidden />}
            {a.file_name}
            <span className="text-muted-foreground">({(a.size_bytes / 1024).toFixed(0)} KB)</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
