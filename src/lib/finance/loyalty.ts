import 'server-only'
import { pointsForAmount, tierForSpend } from '@/lib/finance/tiers'
import type { createAdminClient } from '@/lib/supabase/server'

export { pointsForAmount, tierForSpend } from '@/lib/finance/tiers'

/**
 * Chamado sempre que um pagamento é confirmado (webhook da Stripe ou "pago externamente" pelo
 * admin): soma ao total gasto, atribui pontos e recalcula o nível. Toca na base de dados — por isso
 * fica aqui e não em `finance/tiers.ts` (que é lógica pura, importável também no cliente).
 */
export async function recordPaymentForLoyalty(db: ReturnType<typeof createAdminClient>, clientId: string, amountEur: number) {
  const { data: current } = await db.from('client_loyalty').select('*').eq('client_id', clientId).maybeSingle()
  const totalSpent = (current?.total_spent ?? 0) + amountEur
  const loyaltyPoints = (current?.loyalty_points ?? 0) + pointsForAmount(amountEur)
  const loyaltyTier = tierForSpend(totalSpent)
  await db.from('client_loyalty').upsert({ client_id: clientId, total_spent: totalSpent, loyalty_points: loyaltyPoints, loyalty_tier: loyaltyTier, updated_at: new Date().toISOString() })
  return { totalSpent, loyaltyPoints, loyaltyTier }
}

/**
 * Inverso de `recordPaymentForLoyalty` — chamado ao desfazer um pagamento registado por engano
 * (nunca aconteceu de verdade). Nunca desce abaixo de zero, mesmo que a conta já tenha sido alterada
 * manualmente entretanto (ex.: pontos de bónus oferecidos à parte).
 */
export async function reverseLoyaltyForPayment(db: ReturnType<typeof createAdminClient>, clientId: string, amountEur: number) {
  const { data: current } = await db.from('client_loyalty').select('*').eq('client_id', clientId).maybeSingle()
  if (!current) return
  const totalSpent = Math.max(0, current.total_spent - amountEur)
  const loyaltyPoints = Math.max(0, current.loyalty_points - pointsForAmount(amountEur))
  const loyaltyTier = tierForSpend(totalSpent)
  await db.from('client_loyalty').update({ total_spent: totalSpent, loyalty_points: loyaltyPoints, loyalty_tier: loyaltyTier, updated_at: new Date().toISOString() }).eq('client_id', clientId)
}
