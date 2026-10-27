'use client'

import * as React from 'react'
import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

function Combobox<Value, Multiple extends boolean | undefined = false>({ ...props }: ComboboxPrimitive.Root.Props<Value, Multiple>) {
  return <ComboboxPrimitive.Root data-slot="combobox" {...props} />
}

function ComboboxInputGroup({ className, ...props }: ComboboxPrimitive.InputGroup.Props) {
  return <ComboboxPrimitive.InputGroup data-slot="combobox-input-group" className={cn('relative flex items-center', className)} {...props} />
}

function ComboboxInput({ className, ...props }: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      className={cn(
        'h-9 w-full rounded-lg border border-input bg-background px-2.5 pr-14 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  )
}

function ComboboxIcon({ className, ...props }: ComboboxPrimitive.Icon.Props) {
  return (
    <ComboboxPrimitive.Icon data-slot="combobox-icon" className={cn('pointer-events-none absolute right-2.5 text-muted-foreground', className)} {...props}>
      <ChevronsUpDown className="size-3.5" aria-hidden />
    </ComboboxPrimitive.Icon>
  )
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear data-slot="combobox-clear" className={cn('absolute right-7 text-muted-foreground hover:text-foreground', className)} {...props}>
      <X className="size-3.5" aria-hidden />
      <span className="sr-only">Limpar</span>
    </ComboboxPrimitive.Clear>
  )
}

function ComboboxPositioner({ className, sideOffset = 4, ...props }: ComboboxPrimitive.Positioner.Props) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner data-slot="combobox-positioner" sideOffset={sideOffset} className={cn('z-50', className)} {...props} />
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxPopup({ className, ...props }: ComboboxPrimitive.Popup.Props) {
  return (
    <ComboboxPrimitive.Popup
      data-slot="combobox-popup"
      className={cn(
        'max-h-72 w-(--anchor-width) min-w-40 overflow-auto rounded-xl border border-border bg-card p-1 text-sm shadow-lg outline-none transition duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

function ComboboxList({ ...props }: ComboboxPrimitive.List.Props) {
  return <ComboboxPrimitive.List data-slot="combobox-list" {...props} />
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return <ComboboxPrimitive.Empty data-slot="combobox-empty" className={cn('px-2.5 py-3 text-center text-sm text-muted-foreground', className)} {...props} />
}

function ComboboxItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item data-slot="combobox-item" className={cn('flex cursor-default items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none data-highlighted:bg-muted', className)} {...props}>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ComboboxPrimitive.ItemIndicator>
        <Check className="size-4 shrink-0" aria-hidden />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}

export { Combobox, ComboboxInputGroup, ComboboxInput, ComboboxIcon, ComboboxClear, ComboboxPositioner, ComboboxPopup, ComboboxList, ComboboxEmpty, ComboboxItem }

export type ComboboxOption = { value: string; label: string; hint?: string }

/**
 * Seletor pesquisável para listas que podem crescer (clientes, leads, administradores…),
 * em substituição de um `<select>` nativo. Mostra sempre a opção em texto (nunca só o id) e filtra
 * por nome enquanto se escreve. Quando `name` é passado, mantém um input oculto com o valor
 * selecionado — compatível com formulários nativos (`<form method="get">`).
 */
function SearchableSelect({
  items,
  value,
  onValueChange,
  placeholder = 'Pesquisar…',
  emptyMessage = 'Nenhum resultado encontrado.',
  ariaLabel,
  name,
  disabled,
  className,
  id,
}: {
  items: ComboboxOption[]
  value: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  emptyMessage?: string
  ariaLabel?: string
  name?: string
  disabled?: boolean
  className?: string
  id?: string
}) {
  const labelOf = React.useCallback((v: string) => items.find((i) => i.value === v)?.label ?? '', [items])
  const values = React.useMemo(() => items.map((i) => i.value), [items])

  return (
    <>
      <Combobox items={values} value={value} onValueChange={onValueChange} itemToStringLabel={labelOf} disabled={disabled}>
        <ComboboxInputGroup>
          <ComboboxInput id={id} aria-label={ariaLabel} placeholder={placeholder} className={className} />
          <ComboboxClear />
          <ComboboxIcon />
        </ComboboxInputGroup>
        <ComboboxPositioner align="start">
          <ComboboxPopup>
            <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
            <ComboboxList>{(itemValue: string) => <ComboboxItem key={itemValue} value={itemValue}>{labelOf(itemValue)}</ComboboxItem>}</ComboboxList>
          </ComboboxPopup>
        </ComboboxPositioner>
      </Combobox>
      {name && <input type="hidden" name={name} value={value ?? ''} />}
    </>
  )
}

export { SearchableSelect }
