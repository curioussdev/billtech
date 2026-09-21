'use client'

import { useId, useState } from 'react'
import { ArrowDown, ArrowUp, ImageUp, Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Field } from '@/lib/content/editor-config'
import { createClient } from '@/lib/supabase/client'
import { MEDIA_BUCKET } from '@/lib/supabase/config'

type Json = any // O valor é validado com zod no servidor; aqui o editor é genérico.

export function emptyValue(field: Field): Json {
  switch (field.type) {
    case 'boolean':
      return false
    case 'select':
      return field.options[0]?.value ?? ''
    case 'image':
      return { src: '', alt: '' }
    case 'images':
    case 'strings':
    case 'list':
      return []
    default:
      return ''
  }
}

const move = <T,>(items: T[], from: number, to: number) => {
  if (to < 0 || to >= items.length) return items
  const copy = [...items]
  copy.splice(to, 0, copy.splice(from, 1)[0])
  return copy
}

function ItemControls({ index, length, onMove, onRemove, label }: { index: number; length: number; onMove: (to: number) => void; onRemove: () => void; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Subir ${label}`}>
        <ArrowUp aria-hidden />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" disabled={index === length - 1} onClick={() => onMove(index + 1)} aria-label={`Descer ${label}`}>
        <ArrowDown aria-hidden />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label={`Remover ${label}`} className="text-destructive">
        <Trash2 aria-hidden />
      </Button>
    </div>
  )
}

function ImageEditor({ label, folder, value, onChange, help }: { label: string; folder: string; value: { src: string; alt: string }; onChange: (v: { src: string; alt: string }) => void; help?: string }) {
  const id = useId()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File) {
    setError(null)
    if (file.size > 5 * 1024 * 1024) return setError('A imagem excede 5 MB.')
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
      const path = `${folder}/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { cacheControl: '31536000', contentType: file.type })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
      onChange({ ...value, src: data.publicUrl })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no carregamento.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <fieldset className="grid gap-3 rounded-xl border border-border p-4">
      <legend className="px-1 text-sm font-medium">{label}</legend>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted sm:w-48">
          {value.src ? (
            // eslint-disable-next-line @next/next/no-img-element -- pré-visualização no admin
            <img src={value.src} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">Sem imagem</span>
          )}
        </div>
        <div className="grid flex-1 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-src`}>Endereço da imagem</Label>
            <Input id={`${id}-src`} value={value.src} onChange={(e) => onChange({ ...value, src: e.target.value })} placeholder="https://… ou carregue um ficheiro" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-alt`}>Descrição (texto alternativo)</Label>
            <Input id={`${id}-alt`} value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" disabled={uploading} render={<label htmlFor={`${id}-file`} className="cursor-pointer" />} nativeButton={false}>
              {uploading ? <Loader2 className="animate-spin" aria-hidden /> : <ImageUp aria-hidden />} Carregar imagem
            </Button>
            <input
              id={`${id}-file`}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void upload(file)
                e.target.value = ''
              }}
            />
            <span className="text-xs text-muted-foreground">JPG, PNG, WebP ou AVIF · até 5 MB</span>
          </div>
          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>
    </fieldset>
  )
}

function StringsEditor({ field, value, onChange }: { field: Extract<Field, { type: 'strings' }>; value: string[]; onChange: (v: string[]) => void }) {
  const id = useId()
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-sm font-medium">{field.label}</legend>
      {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
      {value.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          {field.multiline ? (
            <Textarea aria-label={`${field.label} ${i + 1}`} value={item} rows={3} onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))} />
          ) : (
            <Input aria-label={`${field.label} ${i + 1}`} value={item} onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))} />
          )}
          <ItemControls index={i} length={value.length} onMove={(to) => onChange(move(value, i, to))} onRemove={() => onChange(value.filter((_, j) => j !== i))} label={`${field.label} ${i + 1}`} />
        </div>
      ))}
      <Button id={`${id}-add`} type="button" variant="outline" size="sm" className="w-fit" onClick={() => onChange([...value, ''])}>
        <Plus aria-hidden /> Adicionar
      </Button>
    </fieldset>
  )
}

export function FieldEditor({ field, value, onChange }: { field: Field; value: Json; onChange: (v: Json) => void }) {
  const id = useId()

  switch (field.type) {
    case 'text':
    case 'url':
      return (
        <div className="grid gap-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Input id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
          {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
        </div>
      )
    case 'textarea':
      return (
        <div className="grid gap-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Textarea id={id} rows={4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
          {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
        </div>
      )
    case 'boolean':
      return (
        <div className="flex items-start gap-3">
          <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-4 accent-[var(--primary)]" />
          <div>
            <Label htmlFor={id}>{field.label}</Label>
            {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
          </div>
        </div>
      )
    case 'select':
      return (
        <div className="grid gap-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none">
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )
    case 'image':
      return <ImageEditor label={field.label} folder={field.folder} help={field.help} value={value ?? { src: '', alt: '' }} onChange={onChange} />
    case 'images': {
      const items: { src: string; alt: string }[] = value ?? []
      return (
        <fieldset className="grid gap-3">
          <legend className="mb-1 text-sm font-medium">{field.label}</legend>
          {items.map((item, i) => (
            <div key={i} className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Imagem {i + 1}</span>
                <ItemControls index={i} length={items.length} onMove={(to) => onChange(move(items, i, to))} onRemove={() => onChange(items.filter((_, j) => j !== i))} label={`imagem ${i + 1}`} />
              </div>
              <ImageEditor label={`${field.label} — ${i + 1}`} folder={field.folder} value={item} onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => onChange([...items, { src: '', alt: '' }])}>
            <Plus aria-hidden /> Adicionar imagem
          </Button>
        </fieldset>
      )
    }
    case 'strings':
      return <StringsEditor field={field} value={value ?? []} onChange={onChange} />
    case 'list': {
      const items: Record<string, Json>[] = value ?? []
      return (
        <fieldset className="grid gap-3">
          <legend className="mb-1 text-sm font-medium">{field.label}</legend>
          {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
          {items.map((item, i) => (
            <div key={i} className="grid gap-4 rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {field.itemLabel} {i + 1}
                </span>
                <ItemControls index={i} length={items.length} onMove={(to) => onChange(move(items, i, to))} onRemove={() => onChange(items.filter((_, j) => j !== i))} label={`${field.itemLabel} ${i + 1}`} />
              </div>
              {field.fields.map((child) => (
                <FieldEditor key={child.name} field={child} value={item[child.name]} onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, [child.name]: v } : x)))} />
              ))}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => onChange([...items, Object.fromEntries(field.fields.map((f) => [f.name, emptyValue(f)]))])}
          >
            <Plus aria-hidden /> Adicionar {field.itemLabel.toLowerCase()}
          </Button>
        </fieldset>
      )
    }
  }
}

export function FieldsForm({ fields, value, onChange }: { fields: Field[]; value: Record<string, Json>; onChange: (v: Record<string, Json>) => void }) {
  return (
    <div className="grid gap-6">
      {fields.map((field) => (
        <FieldEditor key={field.name} field={field} value={value[field.name]} onChange={(v) => onChange({ ...value, [field.name]: v })} />
      ))}
    </div>
  )
}
