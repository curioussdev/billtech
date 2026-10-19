'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownCircle, ArrowUpCircle, Loader2, Plus, Receipt, Trash2 } from 'lucide-react'
import { createExpense, deleteExpense } from '@/actions/payments'
import { ConfirmButton } from '@/components/admin/editor/confirm-button'
import { CurrencyInput } from '@/components/shared/currency-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatEUR } from '@/lib/finance/labels'
import { cn } from '@/lib/utils'
import { EXPENSE_CATEGORIES, type ExpenseCategory, type LedgerEntry } from '@/types/finance'

const inputClass = 'h-9 rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'

const categoryLabels: Record<ExpenseCategory, string> = {
  geral: 'Geral',
  ferramentas: 'Ferramentas',
  marketing: 'Marketing',
  subcontratacao: 'Subcontratação',
  infraestrutura: 'Infraestrutura',
  impostos: 'Impostos',
}

function CreateExpenseForm() {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('geral')
  const [incurredAt, setIncurredAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await createExpense({ description, amount, category, incurredAt })
    setPending(false)
    if (!result.ok) return setError(result.message)
    setDescription('')
    setAmount('')
    setCategory('geral')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-dashed border-border p-4 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
      <div className="grid gap-1">
        <Label htmlFor="new-expense-desc" className="text-xs">Descrição</Label>
        <Input id="new-expense-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Subscrição Vercel" required className={inputClass} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="new-expense-amount" className="text-xs">Valor</Label>
        <CurrencyInput id="new-expense-amount" value={amount} onChange={setAmount} required className="h-9" />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="new-expense-category" className="text-xs">Categoria</Label>
        <select id="new-expense-category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className={inputClass}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {categoryLabels[c]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1">
        <Label htmlFor="new-expense-date" className="text-xs">Data</Label>
        <Input id="new-expense-date" type="date" value={incurredAt} onChange={(e) => setIncurredAt(e.target.value)} required className={inputClass} />
      </div>
      <div className="flex items-end">
        <Button type="submit" size="sm" disabled={pending} className="w-full">
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />} Registar
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive sm:col-span-5">
          {error}
        </p>
      )}
    </form>
  )
}

const kindStyles = {
  invoice: 'text-foreground',
  payment: 'text-emerald-700 dark:text-emerald-400',
  expense: 'text-red-700 dark:text-red-400',
}

const kindLabels = { invoice: 'Faturado', payment: 'Recebido', expense: 'Despesa' }

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const signed = entry.kind === 'expense' ? -entry.amount : entry.amount
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        {entry.kind === 'expense' ? <ArrowDownCircle className="size-4 shrink-0 text-red-600" aria-hidden /> : <ArrowUpCircle className="size-4 shrink-0 text-emerald-600" aria-hidden />}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{entry.label}</p>
          <p className="text-xs text-muted-foreground">
            {kindLabels[entry.kind]} · {new Date(entry.date).toLocaleDateString('pt-PT', { timeZone: 'UTC' })}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={cn('text-sm font-semibold tabular-nums', kindStyles[entry.kind])}>
          {signed < 0 ? '-' : ''}
          {formatEUR(Math.abs(signed))}
        </span>
        {entry.kind === 'expense' && (
          <form action={deleteExpense}>
            <input type="hidden" name="id" value={entry.id} />
            <ConfirmButton message={`Remover a despesa "${entry.label}"?`} variant="ghost" size="icon-sm" aria-label={`Remover despesa ${entry.label}`}>
              <Trash2 className="size-3.5" aria-hidden />
            </ConfirmButton>
          </form>
        )}
      </div>
    </li>
  )
}

export function LedgerSection({ entries }: { entries: LedgerEntry[] }) {
  return (
    <div className="grid gap-4">
      <CreateExpenseForm />
      {entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
          <Receipt className="mx-auto mb-2 size-5" aria-hidden />
          Ainda não há movimentos.
        </p>
      ) : (
        <ul className="grid gap-2">
          {entries.map((entry, i) => (
            <LedgerRow key={`${entry.kind}-${entry.date}-${i}`} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  )
}
