'use server'

import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { businessNow, listProjects } from '@/lib/admin/analytics'
import { filterProjects, REVENUE_PERIODS, sortProjects, SORT_KEYS } from '@/lib/admin/business'
import { projectStatusLabels, sectorLabels } from '@/lib/admin/format'
import { PROJECT_STATUSES, SECTORS } from '@/types/project'

const filtersSchema = z.object({
  periodo: z.enum(REVENUE_PERIODS),
  setor: z.union([z.enum(SECTORS), z.literal('todos')]),
  estado: z.union([z.enum(PROJECT_STATUSES), z.literal('todos')]),
  ordem: z.enum(SORT_KEYS).default('data'),
  dir: z.enum(['asc', 'desc']).default('desc'),
})

/** Células que o Excel interpretaria como fórmula ganham um apóstrofo (CSV injection). */
const cell = (value: string | number) => {
  const text = String(value)
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return /[;"\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export type CsvResult = { ok: true; filename: string; csv: string; rows: number } | { ok: false; message: string }

/**
 * Exporta a tabela de receita (com os filtros ativos) em CSV.
 * Separador ";" e BOM UTF-8: abre corretamente no Excel em português.
 * Quando os dados vierem da base de dados, só esta função precisa de mudar a origem.
 */
export async function exportRevenueCsv(filters: unknown): Promise<CsvResult> {
  const admin = await requireAdmin()
  const parsed = filtersSchema.safeParse(filters)
  if (!parsed.success) return { ok: false, message: 'Filtros inválidos.' }

  const { periodo, setor, estado, ordem, dir } = parsed.data
  const rows = sortProjects(filterProjects(await listProjects(), { periodo, setor, estado }, businessNow()), ordem, dir)

  const header = ['Cliente', 'Projeto', 'Setor', 'Valor (EUR)', 'Status', 'Margem (%)', 'Data de venda']
  const lines = rows.map((p) => [p.client, p.name, sectorLabels[p.sector], p.value, projectStatusLabels[p.status], p.marginPct, p.soldAt].map(cell).join(';'))
  const csv = `﻿${[header.join(';'), ...lines].join('\r\n')}\r\n`

  await logAudit({ admin, action: 'EXPORT_REVENUE', resource: 'negocio', details: { filtros: { periodo, setor, estado }, linhas: rows.length } })
  return { ok: true, filename: `receita-${periodo}-${businessNow().toISOString().slice(0, 10)}.csv`, csv, rows: rows.length }
}
