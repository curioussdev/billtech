import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { BusinessStatusBadge, StatCard } from '@/components/admin/business/widgets'
import { ExportCsvButton } from '@/components/admin/business/export-csv-button'
import { DemoBanner } from '@/components/admin/dashboard/demo-banner'
import { Button } from '@/components/ui/button'
import { businessNow, listProjects } from '@/lib/admin/analytics'
import {
  filterProjects,
  parseRevenueFilters,
  periodLabels,
  REVENUE_PERIODS,
  revenueSummary,
  SORT_KEYS,
  sortProjects,
  type SortKey,
} from '@/lib/admin/business'
import { formatEUR, formatPct, projectStatusLabels, sectorLabels } from '@/lib/admin/format'
import { PROJECT_STATUSES, SECTORS } from '@/types/project'

export const metadata: Metadata = { title: 'Receita & Projetos' }

const selectClass =
  'h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'

const columns: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'projeto', label: 'Projeto' },
  { key: 'setor', label: 'Setor' },
  { key: 'valor', label: 'Valor', numeric: true },
  { key: 'status', label: 'Status' },
  { key: 'margem', label: 'Margem', numeric: true },
  { key: 'data', label: 'Data' },
]

type Search = { periodo?: string; setor?: string; estado?: string; ordem?: string; dir?: string }

export default async function RevenuePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const filters = parseRevenueFilters(sp)
  const ordem: SortKey = (SORT_KEYS as readonly string[]).includes(sp.ordem ?? '') ? (sp.ordem as SortKey) : 'data'
  const dir = sp.dir === 'asc' ? 'asc' : 'desc'

  const now = businessNow()
  const rows = sortProjects(filterProjects(await listProjects(), filters, now), ordem, dir)
  const s = revenueSummary(rows)

  const sortHref = (key: SortKey) => {
    const params = new URLSearchParams({ periodo: filters.periodo, setor: filters.setor, estado: filters.estado, ordem: key, dir: ordem === key && dir === 'desc' ? 'asc' : 'desc' })
    return `/admin/revenue?${params.toString()}`
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Receita &amp; Projetos</h1>
        <p className="mt-1 text-muted-foreground">Projetos vendidos, faturação e margem. {periodLabels[filters.periodo]}.</p>
      </div>
      <DemoBanner trafficIsLive={false} />

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Receita total" value={formatEUR(s.total)} hint={`${s.count} ${s.count === 1 ? 'projeto' : 'projetos'} · ${periodLabels[filters.periodo]}`} />
        <StatCard label="Ticket médio por projeto" value={formatEUR(s.avgTicket)} delay={0.06} />
        <StatCard label="Projeto de maior receita" value={s.top ? formatEUR(s.top.value) : '—'} hint={s.top ? `${s.top.client} · ${s.top.name}` : 'Sem projetos neste filtro'} delay={0.12} />
        <StatCard label="Margem média (ponderada)" value={formatPct(s.avgMarginPct)} hint="Ponderada pelo valor de cada projeto" delay={0.18} />
      </section>

      <form method="get" aria-label="Filtros" className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[repeat(3,1fr)_auto]">
        <input type="hidden" name="ordem" value={ordem} />
        <input type="hidden" name="dir" value={dir} />
        <label className="grid gap-1 text-xs font-medium">
          Período
          <select name="periodo" defaultValue={filters.periodo} className={selectClass}>
            {REVENUE_PERIODS.map((p) => (
              <option key={p} value={p}>
                {periodLabels[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium">
          Setor
          <select name="setor" defaultValue={filters.setor} className={selectClass}>
            <option value="todos">Todos os setores</option>
            {SECTORS.map((v) => (
              <option key={v} value={v}>
                {sectorLabels[v]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium">
          Status
          <select name="estado" defaultValue={filters.estado} className={selectClass}>
            <option value="todos">Todos os status</option>
            {PROJECT_STATUSES.map((v) => (
              <option key={v} value={v}>
                {projectStatusLabels[v]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit" size="sm">
            Aplicar
          </Button>
          <Button render={<Link href="/admin/revenue" />} nativeButton={false} variant="ghost" size="sm">
            Limpar
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" role="status">
          {rows.length} {rows.length === 1 ? 'projeto' : 'projetos'}
        </p>
        <ExportCsvButton filters={filters} ordem={ordem} dir={dir} />
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-muted-foreground">Nenhum projeto corresponde aos filtros escolhidos.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[860px] text-left text-sm">
            <caption className="sr-only">Projetos vendidos, ordenados por {ordem}</caption>
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {columns.map((col) => {
                  const active = ordem === col.key
                  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown
                  return (
                    <th key={col.key} scope="col" aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={col.numeric ? 'px-4 py-3 text-right' : 'px-4 py-3'}>
                      <Link href={sortHref(col.key)} className="inline-flex items-center gap-1 rounded hover:text-foreground">
                        {col.label} <Icon className="size-3" aria-hidden />
                      </Link>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{p.client}</td>
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3">{sectorLabels[p.sector]}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatEUR(p.value)}</td>
                  <td className="px-4 py-3">
                    <BusinessStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatPct(p.marginPct)}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">{new Date(p.soldAt).toLocaleDateString('pt-PT', { timeZone: 'UTC' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
