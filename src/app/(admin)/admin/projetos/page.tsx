import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteProject, moveProject, seedProjects } from '@/actions/dashboard'
import { ConfirmButton } from '@/components/admin/editor/confirm-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { defaultProjects } from '@/data/projects'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Projetos' }

export default async function ProjectsAdminPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('projects').select('id, slug, published, data').order('position', { ascending: true })
  const rows = data ?? []

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Projetos</h1>
          <p className="mt-2 text-muted-foreground">Casos de sucesso do carrossel e respetivas páginas. A ordem aqui é a ordem no site.</p>
        </div>
        <Button render={<Link href="/admin/projetos/novo" />} nativeButton={false}>
          <Plus aria-hidden /> Novo projeto
        </Button>
      </div>

      {rows.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-6">
          <p className="font-medium">Ainda não há projetos na base de dados.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            O site está a mostrar {defaultProjects.length} projetos de exemplo. Importe-os para os poder editar, ou crie o primeiro projeto real (nesse caso os exemplos deixam de aparecer).
          </p>
          <form action={seedProjects} className="mt-4">
            <Button type="submit" variant="outline">
              Importar {defaultProjects.length} projetos de exemplo
            </Button>
          </form>
        </div>
      )}

      <ul className="mt-8 grid gap-3">
        {rows.map((row, i) => (
          <li key={row.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura no admin */}
            <img src={row.data?.cover?.src} alt="" className="h-16 w-24 rounded-lg bg-muted object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{row.data?.title ?? row.slug}</p>
              <p className="truncate text-sm text-muted-foreground">/projetos/{row.slug}</p>
            </div>
            <Badge variant={row.published ? 'default' : 'outline'} className="h-auto px-2.5 py-1">
              {row.published ? 'Publicado' : 'Rascunho'}
            </Badge>
            <div className="flex items-center gap-1">
              {(['up', 'down'] as const).map((direction) => (
                <form key={direction} action={moveProject}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="direction" value={direction} />
                  <Button type="submit" variant="ghost" size="icon-sm" disabled={direction === 'up' ? i === 0 : i === rows.length - 1} aria-label={`${direction === 'up' ? 'Subir' : 'Descer'} ${row.data?.title ?? row.slug}`}>
                    {direction === 'up' ? <ArrowUp aria-hidden /> : <ArrowDown aria-hidden />}
                  </Button>
                </form>
              ))}
              <Button render={<Link href={`/admin/projetos/${row.id}`} />} nativeButton={false} variant="outline" size="sm">
                <Pencil aria-hidden /> Editar
              </Button>
              <form action={deleteProject}>
                <input type="hidden" name="id" value={row.id} />
                <ConfirmButton message={`Apagar o projeto "${row.data?.title ?? row.slug}"? Esta ação não pode ser desfeita.`} variant="ghost" size="icon-sm" className="text-destructive" aria-label={`Apagar ${row.data?.title ?? row.slug}`}>
                  <Trash2 aria-hidden />
                </ConfirmButton>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
