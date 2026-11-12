import Link from 'next/link'
import type { ReactNode } from 'react'

export function FooterNav({ title, links, children }: { title: string; links: { href: string; label: string }[]; children?: ReactNode }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
      <ul className="mt-4 grid gap-3 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="rounded-sm text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </Link>
          </li>
        ))}
        {children}
      </ul>
    </nav>
  )
}
