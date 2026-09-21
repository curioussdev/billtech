import type { Metadata } from 'next'
import { EditorForm } from '@/components/admin/editor/editor-form'
import { emptyProject } from '@/lib/content/editor-config'

export const metadata: Metadata = { title: 'Novo projeto' }

export default function NewProjectPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-black tracking-tight">Novo projeto</h1>
      <p className="mb-8 mt-2 text-muted-foreground">Fica como rascunho até marcar «Publicado no site».</p>
      <EditorForm kind="project" projectId={null} initial={emptyProject} />
    </div>
  )
}
