import Link from 'next/link'
import { Code2, ShieldCheck } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { BrandName } from '@/components/brand-name'
import { ManageCookiesLink } from '@/components/cookie-banner'
import { SocialLinks } from '@/components/social-links'
import type { SiteContent } from '@/lib/content/schema'

const quickLinks = [
  { href: '/#solucoes', label: 'Soluções' },
  { href: '/#projetos', label: 'Portfólio' },
  { href: '/#sobre', label: 'Sobre' },
  { href: '/#contato', label: 'Contacto' },
]

const legalLinks = [
  { href: '/privacidade', label: 'Política de Privacidade' },
  { href: '/termos', label: 'Termos de Uso' },
  { href: '/cookies', label: 'Política de Cookies' },
]

export function Footer({ general, socials }: { general: SiteContent['general']; socials: SiteContent['socials'] }) {
  return (
    <footer className="border-t border-border px-5 pb-8 pt-16 lg:px-8">
      <Reveal className="mx-auto max-w-7xl">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="grid gap-4">
            <Link href="/" className="flex w-fit items-center gap-2 rounded-md text-xl font-black tracking-tight">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Code2 aria-hidden />
              </span>
              <span>
                <BrandName name={general.brandName} />
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-6 text-muted-foreground">Soluções digitais sob medida para o seu negócio: websites, sistemas e automações que fazem a empresa crescer.</p>
            <SocialLinks items={socials.items} />
          </div>

          <nav aria-label="Links rápidos">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Links rápidos</h2>
            <ul className="mt-4 grid gap-3 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="rounded-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal e segurança">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Legal &amp; Segurança</h2>
            <ul className="mt-4 grid gap-3 text-sm">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="rounded-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <ManageCookiesLink className="rounded-sm text-muted-foreground transition-colors hover:text-foreground" />
              </li>
            </ul>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
              Site seguro com encriptação SSL
            </p>
          </nav>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {general.brandName}. Todos os direitos reservados. {general.footerText}
          </p>
        </div>
      </Reveal>
    </footer>
  )
}
