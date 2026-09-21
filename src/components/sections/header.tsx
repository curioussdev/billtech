'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Code2, Menu, X } from 'lucide-react'
import { AuthLink } from '@/components/auth-link'
import { BrandName } from '@/components/brand-name'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { navLinks } from '@/data/site'

export function Header({ brandName, ctaLabel }: { brandName: string; ctaLabel: string }) {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Escape fecha o menu e devolve o foco ao botão
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2 rounded-md text-xl font-black tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Code2 aria-hidden />
          </span>
          <span>
            <BrandName name={brandName} />
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-8 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-sm text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <AuthLink className="hidden sm:inline-flex" />
          <ThemeToggle />
          <Button render={<Link href="/#contato" />} nativeButton={false} className="hidden h-9 rounded-full px-5 sm:inline-flex">
            {ctaLabel} <ArrowRight data-icon="inline-end" aria-hidden />
          </Button>
          <Button
            ref={toggleRef}
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          >
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
          </Button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Principal (móvel)" className="flex flex-col gap-1 border-t border-border bg-background px-5 py-4 text-base font-medium md:hidden">
          {[...navLinks, { href: '/#contato', label: ctaLabel }, { href: '/conta', label: 'Entrar / A minha conta' }].map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-md px-2 py-3 hover:bg-muted">
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
