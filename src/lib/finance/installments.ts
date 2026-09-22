/** Lógica pura (sem I/O) de divisão em parcelas — partilhada entre a conversão do admin e o
 * pedido de parcelamento do próprio cliente, para nunca haver duas fórmulas de arredondamento. */
export function buildInstallmentRows(finalAmountEur: number, count: number, dueDateBase: string) {
  const totalCents = Math.round(finalAmountEur * 100)
  const baseCents = Math.floor(totalCents / count)
  const remainderCents = totalCents - baseCents * count // fica na 1ª parcela
  const base = new Date(dueDateBase)

  return Array.from({ length: count }, (_, i) => ({
    installment_number: i + 1,
    amount: (baseCents + (i === 0 ? remainderCents : 0)) / 100,
    due_date: new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + i, base.getUTCDate())).toISOString().slice(0, 10),
    status: 'pendente' as const,
  }))
}
