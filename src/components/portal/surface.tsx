import type { ComponentProps, ElementType } from 'react'
import { cn } from '@/lib/utils'

const toneClass = {
  default: 'border-border bg-card',
  muted: 'border-border bg-muted/30',
  dashed: 'border-dashed border-border bg-card',
  primary: 'border-primary/30 bg-primary/5',
} as const

/**
 * Shell de cartão do portal — um só sítio para o `rounded-2xl border ... bg-card` hoje repetido à
 * mão em todas as páginas de `área-cliente`. Independente de `components/ui/card.tsx` (esse continua
 * a servir o admin, sem alterações). Padding fica ao critério de quem usa (`className`), porque varia
 * de página para página. `as` permite manter semântica de lista (`<ul>`) quando o conteúdo é uma lista.
 */
export function Surface({ as: Tag = 'div', tone = 'default', className, ...rest }: { as?: ElementType; tone?: keyof typeof toneClass } & ComponentProps<'div'>) {
  return <Tag className={cn('rounded-2xl border', toneClass[tone], className)} {...rest} />
}
