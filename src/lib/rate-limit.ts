import 'server-only'
import type { createAdminClient } from '@/lib/supabase/server'

/**
 * Limite de frequência por cliente+ação, apoiado em `payment_action_requests` — generaliza o
 * limitador já existente para "esqueci a password" (`password_reset_requests`) para ações de
 * pagamento que chamam a Stripe (checkout, configurar/revogar débito automático). Regista sempre a
 * tentativa, mesmo quando bloqueada, para o limite ser sobre pedidos recebidos, não só sucessos.
 * Nunca lança: uma falha aqui (ex. BD em baixo) deixa a ação passar — o limite é uma rede de
 * segurança extra, não a única defesa (todas as ações continuam a exigir sessão autenticada).
 */
export async function checkPaymentRateLimit(
  db: ReturnType<typeof createAdminClient>,
  clientId: string,
  action: string,
  { max, windowSeconds }: { max: number; windowSeconds: number },
): Promise<boolean> {
  try {
    const since = new Date(Date.now() - windowSeconds * 1000).toISOString()
    const { count } = await db.from('payment_action_requests').select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('action', action).gte('requested_at', since)
    await db.from('payment_action_requests').insert({ client_id: clientId, action })
    return (count ?? 0) < max
  } catch (error) {
    console.error(`[rate-limit] falha ao verificar ${action} para ${clientId}:`, error)
    return true
  }
}

export const RATE_LIMIT_MESSAGE = 'Demasiados pedidos em pouco tempo. Aguarde um momento e tente novamente.'
