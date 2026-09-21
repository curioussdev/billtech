import Link from 'next/link'
import { BriefcaseBusiness, Code2 } from 'lucide-react'
import { SocialLinks } from '@/components/social-links'
import type { SiteContent } from '@/lib/content/schema'

export function Footer({ general, socials }: { general: SiteContent['general']; socials: SiteContent['socials'] }) {
  return (
    <footer className="border-t border-border px-5 py-8 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 text-sm text-muted-foreground md:flex-row md:items-center">
        <Link href="/" className="flex items-center gap-2 rounded-md font-bold text-foreground">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Code2 aria-hidden />
          </span>
          {general.brandName}
        </Link>
        <p>
          © {new Date().getFullYear()} {general.brandName}. {general.footerText}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SocialLinks items={socials.items} />
          <Link href="/#contato" className="inline-flex items-center gap-2 rounded-md hover:text-foreground">
            Fale com a nossa equipa <BriefcaseBusiness aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </footer>
  )
}
