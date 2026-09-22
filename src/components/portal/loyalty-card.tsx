import { Award, Crown, Gem, Medal } from 'lucide-react'
import { amountToNextTier } from '@/lib/finance/tiers'
import { formatEUR, loyaltyTierLabels } from '@/lib/finance/labels'
import { cn } from '@/lib/utils'
import type { ClientLoyalty } from '@/types/finance'

const tierIcon = { bronze: Award, silver: Medal, gold: Crown, platinum: Gem } as const
const tierStyle = {
  bronze: 'from-amber-700/20 to-amber-700/5 text-amber-800 dark:text-amber-400',
  silver: 'from-slate-400/25 to-slate-400/5 text-slate-700 dark:text-slate-300',
  gold: 'from-yellow-500/25 to-yellow-500/5 text-yellow-700 dark:text-yellow-400',
  platinum: 'from-primary/25 to-primary/5 text-primary',
} as const

/**
 * Cartão de fidelidade (gamificação): transforma pagar uma fatura num passo para um benefício
 * futuro, em vez de ser só uma cobrança — o que reduz a tentação de ir à concorrência no próximo
 * projeto. `loyalty` nulo (cliente ainda sem histórico) mostra o nível inicial, não um erro.
 */
export function LoyaltyCard({ loyalty }: { loyalty: ClientLoyalty | null }) {
  const tier = loyalty?.loyaltyTier ?? 'bronze'
  const points = loyalty?.loyaltyPoints ?? 0
  const totalSpent = loyalty?.totalSpent ?? 0
  const Icon = tierIcon[tier]
  const next = amountToNextTier(totalSpent)

  return (
    <div className={cn('rounded-2xl border border-border bg-gradient-to-br p-5', tierStyle[tier])}>
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background/70">
          <Icon className="size-6" aria-hidden />
        </span>
        <div>
          <p className="text-lg font-black leading-tight">Nível {loyaltyTierLabels[tier]}</p>
          <p className="text-sm font-medium tabular-nums opacity-90">{points.toLocaleString('pt-PT')} pontos BillTech</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 opacity-90">
        {next ? (
          <>
            Faltam <strong className="tabular-nums">{formatEUR(next.amountNeeded)}</strong> em projetos para chegar ao nível{' '}
            <strong>{loyaltyTierLabels[next.nextTier]}</strong>.
          </>
        ) : (
          'Já está no nível máximo — obrigado pela parceria.'
        )}
      </p>
    </div>
  )
}
