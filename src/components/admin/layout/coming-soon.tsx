import { Construction } from 'lucide-react'

/** Página provisória de um módulo ainda não implementado. */
export function ComingSoon({ title, description, note }: { title: string; description: string; note?: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-black tracking-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-dashed border-border p-6">
        <Construction className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">{note ?? 'Módulo em construção — chega numa das próximas etapas.'}</p>
      </div>
    </div>
  )
}
