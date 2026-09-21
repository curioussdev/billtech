import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/lib/audit'
import { getSuperAdminOrNull } from '@/lib/auth'
import { SUPER_ADMIN_EMAILS } from '@/lib/super-admins'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Auditoria & Logs' }

const PAGE_SIZE = 50

type Row = {
  id: string
  admin_email: string
  action: string
  target_resource: string
  target_id: string | null
  details: unknown
  ip_address: string | null
  created_at: string
}

type Search = { admin?: string; acao?: string; recurso?: string; de?: string; ate?: string; pagina?: string }

const selectClass =
  'h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'
const isDate = (v?: string) => Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v))

const actionTone = (action: string) =>
  action === 'ACCESS_DENIED'
    ? 'bg-red-500/15 text-red-800 dark:text-red-300'
    : action.startsWith('DELETE')
      ? 'bg-orange-500/15 text-orange-900 dark:text-orange-300'
      : action === 'LOGIN' || action === 'LOGOUT'
        ? 'bg-sky-500/15 text-sky-800 dark:text-sky-300'
        : 'bg-muted text-foreground'

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<Search> }) {
  // Só Super Admins veem a trilha (a RLS do banco também o impõe)
  const admin = await getSuperAdminOrNull()
  if (!admin) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-500/40 bg-red-500/10 p-8 text-center" role="alert">
        <ShieldAlert className="mx-auto size-8 text-red-700 dark:text-red-300" aria-hidden />
        <h1 className="mt-3 text-2xl font-black">403 — Acesso negado</h1>
        <p className="mt-2 text-sm text-muted-foreground">A trilha de auditoria é reservada aos Super Admins autorizados.</p>
      </div>
    )
  }

  const sp = await searchParams
  const page = Math.max(1, Number.parseInt(sp.pagina ?? '1', 10) || 1)

  const supabase = await createClient()
  let query = supabase.from('audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false })
  if (sp.admin && (SUPER_ADMIN_EMAILS as readonly string[]).includes(sp.admin)) query = query.eq('admin_email', sp.admin)
  if (sp.acao && (AUDIT_ACTIONS as readonly string[]).includes(sp.acao)) query = query.eq('action', sp.acao)
  if (sp.recurso && (AUDIT_RESOURCES as readonly string[]).includes(sp.recurso)) query = query.eq('target_resource', sp.recurso)
  if (isDate(sp.de)) query = query.gte('created_at', `${sp.de}T00:00:00`)
  if (isDate(sp.ate)) query = query.lte('created_at', `${sp.ate}T23:59:59`)

  const { data, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  const rows = (data ?? []) as Row[]
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  const link = (p: number) => {
    const params = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== 'pagina') as [string, string][])
    params.set('pagina', String(p))
    return `/admin/logs?${params.toString()}`
  }

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="text-3xl font-black tracking-tight">Auditoria &amp; Logs</h1>
      <p className="mb-6 mt-2 max-w-3xl text-muted-foreground">
        Registo imutável de tudo o que os administradores fazem: quem, o quê, onde e quando. Não pode ser editado nem apagado.
      </p>

      <form method="get" className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6" aria-label="Filtros">
        <label className="grid gap-1 text-xs font-medium">
          Administrador
          <select name="admin" defaultValue={sp.admin ?? ''} className={selectClass}>
            <option value="">Todos</option>
            {SUPER_ADMIN_EMAILS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium">
          Ação
          <select name="acao" defaultValue={sp.acao ?? ''} className={selectClass}>
            <option value="">Todas</option>
            {AUDIT_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium">
          Módulo
          <select name="recurso" defaultValue={sp.recurso ?? ''} className={selectClass}>
            <option value="">Todos</option>
            {AUDIT_RESOURCES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium">
          De
          <input type="date" name="de" defaultValue={sp.de ?? ''} className={selectClass} />
        </label>
        <label className="grid gap-1 text-xs font-medium">
          Até
          <input type="date" name="ate" defaultValue={sp.ate ?? ''} className={selectClass} />
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit" size="sm">
            Filtrar
          </Button>
          <Button render={<Link href="/admin/logs" />} nativeButton={false} variant="ghost" size="sm">
            Limpar
          </Button>
        </div>
      </form>

      <p className="mb-3 text-sm text-muted-foreground" role="status">
        {count ?? 0} registos · página {page} de {totalPages}
      </p>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-muted-foreground">Sem registos para estes filtros.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[820px] text-left text-sm">
            <caption className="sr-only">Registos de auditoria, do mais recente para o mais antigo</caption>
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">Quando</th>
                <th scope="col" className="px-4 py-3">Administrador</th>
                <th scope="col" className="px-4 py-3">Ação</th>
                <th scope="col" className="px-4 py-3">Onde</th>
                <th scope="col" className="px-4 py-3">IP</th>
                <th scope="col" className="px-4 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border align-top">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                    {new Date(r.created_at).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Europe/Lisbon' })}
                  </td>
                  <td className="px-4 py-3 font-medium">{r.admin_email}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn('h-auto px-2 py-0.5 font-mono text-[0.7rem]', actionTone(r.action))} variant="outline">
                      {r.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block">{r.target_resource}</span>
                    {r.target_id && (
                      <span className="block max-w-[14rem] truncate font-mono text-xs text-muted-foreground" title={r.target_id}>
                        {r.target_id}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.ip_address ?? '—'}</td>
                  <td className="px-4 py-3">
                    <details>
                      <summary className="cursor-pointer text-primary">Ver</summary>
                      <pre className="mt-2 max-h-72 max-w-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-3 text-xs">
                        {JSON.stringify(r.details, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Paginação" className="mt-6 flex items-center justify-between">
          {page > 1 ? (
            <Link href={link(page - 1)} className="text-sm font-medium text-primary hover:underline">
              ← Mais recentes
            </Link>
          ) : (
            <span />
          )}
          {page < totalPages && (
            <Link href={link(page + 1)} className="text-sm font-medium text-primary hover:underline">
              Mais antigos →
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}
