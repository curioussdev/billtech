import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const sizeClass = { sm: 'size-10 rounded-xl', md: 'size-11 rounded-xl' } as const
const toneClass = { soft: 'bg-primary/10 text-primary', solid: 'bg-primary text-primary-foreground' } as const

/** Equivalente local ao `marketing/icon-tile.tsx`, para não acoplar o portal à landing page. */
export function IconTile({
  icon: Icon,
  size = 'md',
  tone = 'soft',
  className,
}: {
  icon: LucideIcon
  size?: keyof typeof sizeClass
  tone?: keyof typeof toneClass
  className?: string
}) {
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center', sizeClass[size], toneClass[tone], className)}>
      <Icon aria-hidden />
    </span>
  )
}
