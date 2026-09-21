import { notFound } from 'next/navigation'
import { EditorForm } from '@/components/admin/editor/editor-form'
import { getSiteContent } from '@/lib/content/get'
import { contentEditors } from '@/lib/content/editor-config'
import { contentKeys, type ContentKey } from '@/lib/content/schema'

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  return { title: contentEditors[section as ContentKey]?.title }
}

export default async function ContentEditorPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (!contentKeys.includes(section as ContentKey)) notFound()
  const key = section as ContentKey

  const content = await getSiteContent()

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-black tracking-tight">{contentEditors[key].title}</h1>
      <p className="mb-8 mt-2 text-muted-foreground">{contentEditors[key].description}</p>
      <EditorForm kind="content" contentKey={key} initial={content[key] as Record<string, unknown>} />
    </div>
  )
}
