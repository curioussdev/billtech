'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { saveContent, saveProject, type SaveResult } from '@/actions/dashboard'
import { FieldsForm } from '@/components/admin/editor/field-editor'
import { Button } from '@/components/ui/button'
import { contentEditors, projectFields } from '@/lib/content/editor-config'
import type { ContentKey } from '@/lib/content/schema'

type Props =
  | { kind: 'content'; contentKey: ContentKey; initial: Record<string, unknown> }
  | { kind: 'project'; projectId: string | null; initial: Record<string, unknown> }

export function EditorForm(props: Props) {
  const router = useRouter()
  const [value, setValue] = useState<Record<string, unknown>>(props.initial)
  const [result, setResult] = useState<(SaveResult & { created?: boolean }) | null>(null)
  const [pending, startTransition] = useTransition()

  const fields = props.kind === 'content' ? contentEditors[props.contentKey].fields : projectFields

  function submit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const res = props.kind === 'content' ? await saveContent(props.contentKey, value) : await saveProject(props.projectId, value)
      setResult(res)
      if (res.ok && props.kind === 'project' && 'created' in res && res.created) router.push('/admin/projetos')
      else if (res.ok) router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-8">
      <FieldsForm fields={fields} value={value} onChange={setValue} />

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-border bg-background/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <div role="status" aria-live="polite">
          {result?.ok && <p className="text-sm font-medium text-primary">{result.message}</p>}
        </div>
        <div role="alert">
          {result && !result.ok && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <p className="font-semibold">{result.message}</p>
              {result.issues && (
                <ul className="mt-1 list-disc pl-5">
                  {result.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <Button type="submit" disabled={pending} className="h-11 w-fit rounded-xl px-6">
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} Guardar e publicar
        </Button>
      </div>
    </form>
  )
}
