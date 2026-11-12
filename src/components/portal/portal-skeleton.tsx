import { Surface } from '@/components/portal/surface'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Três formas de esqueleto, uma por tipo de página do portal — substitui o `ModuleSkeleton` do admin
 * (que continua a servir só o admin, sem alterações), que mostrava sempre a mesma grelha de 4
 * indicadores mesmo em páginas de formulário de coluna única ou listas.
 */
function Header() {
  return (
    <div className="grid gap-2">
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-8" role="status" aria-busy="true" aria-label="A carregar">
      <Header />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Surface key={i} className="flex items-center gap-4 p-5">
            <Skeleton className="size-11 shrink-0 rounded-xl" />
            <div className="grid gap-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
          </Surface>
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-2xl" />
      <span className="sr-only">A carregar…</span>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="grid max-w-2xl gap-8" role="status" aria-busy="true" aria-label="A carregar">
      <Header />
      <Surface className="grid gap-4 p-6 sm:p-8">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full" />
      </Surface>
      <Surface className="grid gap-4 p-6 sm:p-8">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-10 w-full" />
      </Surface>
      <span className="sr-only">A carregar…</span>
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div className="grid gap-6" role="status" aria-busy="true" aria-label="A carregar">
      <Header />
      <Surface className="divide-y divide-border overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 p-4">
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-1/3 max-w-56" />
              <Skeleton className="h-3 w-1/4 max-w-40" />
            </div>
            <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
          </div>
        ))}
      </Surface>
      <span className="sr-only">A carregar…</span>
    </div>
  )
}
