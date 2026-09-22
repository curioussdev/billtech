'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { deleteProjectDocument, getProjectDocumentUrl, recordProjectDocument } from '@/actions/documents'
import { createClient } from '@/lib/supabase/client'
import { CLIENT_ATTACHMENTS_BUCKET } from '@/lib/supabase/config'
import type { ProjectDocument } from '@/types/portal'

const MAX_SIZE_BYTES = 10 * 1024 * 1024

/**
 * Documentos do projeto — contratos, acessos, entregáveis. Só o admin carrega ou apaga; o cliente só
 * descarrega. O download passa sempre por um URL assinado (o bucket é privado).
 */
export function DocumentsSection({ projectId, documents, isAdmin }: { projectId: string; documents: ProjectDocument[]; isAdmin: boolean }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(files: FileList | null) {
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
        const path = `projects/${projectId}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`
        const { error: uploadError } = await supabase.storage.from(CLIENT_ATTACHMENTS_BUCKET).upload(path, file, { contentType: file.type || 'application/octet-stream' })
        if (uploadError) throw uploadError
        const result = await recordProjectDocument({ projectId, storagePath: path, fileName: file.name, contentType: file.type, sizeBytes: file.size })
        if (!result.ok) throw new Error(result.message)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Falha ao carregar o documento.')
      } finally {
        setUploading(false)
      }
    }
    if (inputRef.current) inputRef.current.value = ''
    router.refresh()
  }

  async function download(id: string) {
    setDownloading(id)
    const result = await getProjectDocumentUrl({ documentId: id })
    setDownloading(null)
    if (result.ok) window.open(result.url, '_blank', 'noopener,noreferrer')
  }

  async function remove(id: string) {
    setRemoving(id)
    await deleteProjectDocument({ documentId: id })
    setRemoving(null)
    router.refresh()
  }

  return (
    <div className="grid gap-3">
      {isAdmin && (
        <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
          {uploading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Upload className="size-3.5" aria-hidden />}
          Carregar documento
          <input ref={inputRef} type="file" multiple className="sr-only" onChange={(e) => handleUpload(e.target.files)} disabled={uploading} />
        </label>
      )}
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      {documents.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Ainda sem documentos neste projeto.</p>
      ) : (
        <ul className="grid gap-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="truncate font-medium">{doc.file_name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">({(doc.size_bytes / 1024).toFixed(0)} KB)</span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => download(doc.id)} disabled={downloading === doc.id} aria-label={`Descarregar ${doc.file_name}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                  {downloading === doc.id ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
                </button>
                {isAdmin && (
                  <button type="button" onClick={() => remove(doc.id)} disabled={removing === doc.id} aria-label={`Apagar ${doc.file_name}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    {removing === doc.id ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
