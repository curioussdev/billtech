import { ShieldAlert } from 'lucide-react'

/** Resposta 403 para páginas reservadas a Super Admins. */
export function Forbidden({ what }: { what: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-red-500/40 bg-red-500/10 p-8 text-center" role="alert">
      <ShieldAlert className="mx-auto size-8 text-red-700 dark:text-red-300" aria-hidden />
      <h1 className="mt-3 text-2xl font-black">403 — Acesso negado</h1>
      <p className="mt-2 text-sm text-muted-foreground">{what} é reservado aos Super Admins autorizados.</p>
    </div>
  )
}
