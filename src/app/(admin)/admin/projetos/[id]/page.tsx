import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { EditorForm } from '@/components/admin/editor/editor-form'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Editar projeto' }

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()

  const supabase = await createClient()
  const { data: row } = await supabase.from('projects').select('id, slug, published, data').eq('id', id).single()
  if (!row) notFound()

  const initial = { ...(row.data as object), slug: row.slug, published: row.published }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-black tracking-tight">Editar projeto</h1>
      <p className="mb-8 mt-2 text-muted-foreground">{(row.data as { title?: string }).title ?? row.slug}</p>
      <EditorForm kind="project" projectId={row.id} initial={initial} />
    </div>
  )
}
