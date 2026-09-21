import { FlaskConical } from 'lucide-react'

/** Aviso permanente: enquanto os dados vierem de `src/data/mock/`, não são métricas reais do negócio. */
export function DemoBanner() {
  return (
    <p role="note" className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
      <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        <strong>Dados de demonstração.</strong> Clientes, receita, tráfego e utilizadores online são fictícios até ligarmos a base de dados e a ferramenta de analytics.
      </span>
    </p>
  )
}
