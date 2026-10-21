'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, FileSignature, Loader2 } from 'lucide-react'
import { getProjectDocumentUrl } from '@/actions/documents'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/portal/labels'
import type { ProjectDocument } from '@/types/portal'

/**
 * Destaque do contrato no topo da página do projeto. Prioriza o PDF já assinado (documento
 * vinculativo, carregado pelo admin); sem esse, mas com um contrato já enviado para assinatura
 * (`contracts.status='enviado'`), mostra antes uma ligação para o rever/imprimir. Sem nenhum dos
 * dois, não mostra nada.
 */
export function ContractCard({ projectId, document, pendingSentAt }: { projectId: string; document: ProjectDocument | undefined; pendingSentAt?: string | null }) {
  const [downloading, setDownloading] = useState(false)

  if (!document) {
    if (!pendingSentAt) return null
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <FileSignature className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">Contrato enviado para assinatura</p>
              <p className="truncate text-sm text-muted-foreground">Enviado em {formatDate(pendingSentAt)}</p>
            </div>
          </div>
          <Button render={<Link href={`/area-cliente/projetos/${projectId}/contrato`} />} nativeButton={false} variant="outline" size="sm">
            Ver contrato
          </Button>
        </CardContent>
      </Card>
    )
  }

  async function download() {
    setDownloading(true)
    const result = await getProjectDocumentUrl({ documentId: document!.id })
    setDownloading(false)
    if (result.ok) window.open(result.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <FileSignature className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">Contrato assinado</p>
            <p className="truncate text-sm text-muted-foreground">
              {document.file_name} · {formatDate(document.created_at)}
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={download} disabled={downloading}>
          {downloading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
          Descarregar
        </Button>
      </CardContent>
    </Card>
  )
}
