/**
 * Projetos VENDIDOS/entregues a clientes (lado comercial).
 * Não confundir com o case de sucesso público da landing (`Project` em `@/lib/content/schema`).
 */

export const SECTORS = ['oficinas', 'restauracao', 'clinicas', 'comercio', 'imobiliario', 'logistica', 'fitness'] as const
export type Sector = (typeof SECTORS)[number]

export const PROJECT_STATUSES = ['em_desenvolvimento', 'em_teste', 'entregue'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export interface ClientProject {
  id: string
  client: string
  name: string
  sector: Sector
  /** Valor faturado em EUR (sem IVA) */
  value: number
  status: ProjectStatus
  /** Margem em percentagem (0–100) */
  marginPct: number
  /** ISO 8601 — data da venda/assinatura */
  soldAt: string
  /** ISO 8601 — preenchido quando status === 'entregue' */
  deliveredAt?: string
}
