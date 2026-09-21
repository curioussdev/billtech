import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NewRequestForm } from '@/components/portal/forms'
import { getProjects } from '@/lib/portal/queries'
import { REQUEST_TYPES, type RequestType } from '@/types/portal'

export const metadata: Metadata = { title: 'Novo pedido' }

export default async function NewRequestPage({ searchParams }: { searchParams: Promise<{ tipo?: string; projeto?: string }> }) {
  const { tipo, projeto } = await searchParams
  const projects = await getProjects()

  const defaultType = REQUEST_TYPES.includes(tipo as RequestType) ? (tipo as RequestType) : undefined
  // Só pré-seleciona projetos que pertencem ao cliente
  const defaultProjectId = projects.some((p) => p.id === projeto) ? projeto : undefined

  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <Link href="/area-cliente/pedidos" className="inline-flex w-fit items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Pedidos
      </Link>
      <header>
        <h1 className="text-3xl font-black tracking-tight">Novo pedido</h1>
        <p className="mt-2 text-muted-foreground">Conte-nos o que precisa. Não há pedidos «pequenos demais»: respondemos a todos, normalmente no prazo de 1 dia útil, e continuamos a conversa aqui.</p>
      </header>
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-8">
        <NewRequestForm projects={projects.map((p) => ({ id: p.id, name: p.name }))} defaultType={defaultType} defaultProjectId={defaultProjectId} />
      </div>
    </div>
  )
}
