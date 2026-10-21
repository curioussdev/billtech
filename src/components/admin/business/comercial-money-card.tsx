import { Wallet } from 'lucide-react'
import { formatEUR, formatInt } from '@/lib/admin/format'

/** "Dinheiro do Comercial": cobrado vs por cobrar nos negócios ganhos — reaproveita `paymentProgress()`/`listAllInvoices()` do Financeiro, nunca um valor calculado à parte. */
export function ComercialMoneyCard({ collected, outstanding, wonInvoiced }: { collected: number; outstanding: number; wonInvoiced: number }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
        <Wallet className="size-4" aria-hidden /> Dinheiro do Comercial
      </h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Cobrado</p>
          <p className="text-xl font-black tabular-nums text-emerald-700 dark:text-emerald-400">{formatEUR(collected)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Por cobrar</p>
          <p className="text-xl font-black tabular-nums">{formatEUR(outstanding)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Negócios ganhos faturados</p>
          <p className="text-xl font-black tabular-nums">{formatInt(wonInvoiced)}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Negócios ganhos sem fatura associada não entram aqui — ver Financeiro para o detalhe completo.</p>
    </div>
  )
}
