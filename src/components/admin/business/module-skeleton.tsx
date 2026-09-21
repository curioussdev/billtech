import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/** Esqueleto comum aos módulos de negócio: cabeçalho, 4 indicadores e uma área de conteúdo. */
export function ModuleSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl gap-6" role="status" aria-busy="true" aria-label="A carregar">
      <div className="grid gap-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}>
            <CardContent className="grid gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-2xl" />
      <span className="sr-only">A carregar…</span>
    </div>
  )
}
