'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/** Input numérico em euros, com o símbolo fixo — evita repetir o mesmo wrapper em cada formulário financeiro. */
export function CurrencyInput({
  id,
  value,
  onChange,
  min = 0,
  step = '0.01',
  required,
  className,
  ...props
}: {
  id: string
  value: string
  onChange: (value: string) => void
  min?: number
  step?: string
  required?: boolean
  className?: string
} & Omit<React.ComponentProps<typeof Input>, 'id' | 'value' | 'onChange' | 'min' | 'step' | 'required' | 'className' | 'type'>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
      <Input
        id={id}
        type="number"
        min={min}
        step={step}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn('h-11 pl-7 text-base', className)}
        {...props}
      />
    </div>
  )
}
