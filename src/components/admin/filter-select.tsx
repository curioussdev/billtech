'use client'

import { useState } from 'react'
import { SearchableSelect, type ComboboxOption } from '@/components/ui/combobox'

/**
 * Campo de filtro pesquisável para formulários `<form method="get">` nativos (recarrega a página
 * com os parâmetros escolhidos). Mantém um input oculto com `name` para seguir no submit — o
 * `SearchableSelect` em si só mostra o texto, nunca é ele que vai no FormData.
 */
export function FilterSelect({ name, items, defaultValue, placeholder, ariaLabel }: { name: string; items: ComboboxOption[]; defaultValue: string; placeholder: string; ariaLabel?: string }) {
  const [value, setValue] = useState<string | null>(defaultValue || null)
  return <SearchableSelect name={name} items={items} value={value} onValueChange={setValue} placeholder={placeholder} ariaLabel={ariaLabel} emptyMessage="Nenhum resultado encontrado." className="h-9 text-sm" />
}
