import type { LoyaltyTier } from '@/types/finance'

/**
 * Regra de fidelização (simples de propósito, fácil de ajustar depois de ver dados reais):
 * 1 ponto por cada 10€ gasto; o nível sobe conforme o total acumulado gasto pelo cliente.
 * Os mesmos limiares usados na narrativa dos dados de demonstração (`data/mock/finance.ts`).
 *
 * Lógica pura (sem I/O) — ao contrário de `finance/loyalty.ts`, este ficheiro pode ser importado
 * também em componentes de cliente (o cartão de fidelidade calcula "faltam X€ para o próximo nível").
 */
export function pointsForAmount(amountEur: number): number {
  return Math.floor(amountEur / 10)
}

export function tierForSpend(totalSpent: number): LoyaltyTier {
  if (totalSpent >= 20_000) return 'platinum'
  if (totalSpent >= 8_000) return 'gold'
  if (totalSpent >= 2_000) return 'silver'
  return 'bronze'
}

/** Quanto falta gastar para o próximo nível — null no topo (platinum). */
export function amountToNextTier(totalSpent: number): { nextTier: LoyaltyTier; amountNeeded: number } | null {
  const thresholds: [LoyaltyTier, number][] = [
    ['silver', 2_000],
    ['gold', 8_000],
    ['platinum', 20_000],
  ]
  const next = thresholds.find(([, min]) => totalSpent < min)
  return next ? { nextTier: next[0], amountNeeded: Math.round((next[1] - totalSpent) * 100) / 100 } : null
}
