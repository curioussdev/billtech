import { Globe, Mail } from 'lucide-react'
import { FaFacebookF, FaGithub, FaInstagram, FaLinkedinIn, FaTiktok, FaWhatsapp, FaXTwitter, FaYoutube } from 'react-icons/fa6'
import type { SiteContent, SocialPlatform } from '@/lib/content/schema'
import { cn } from '@/lib/utils'

const icons: Record<SocialPlatform, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  linkedin: FaLinkedinIn,
  instagram: FaInstagram,
  github: FaGithub,
  facebook: FaFacebookF,
  x: FaXTwitter,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  whatsapp: FaWhatsapp,
  email: Mail,
  website: Globe,
}

export function SocialLinks({ items, className }: { items: SiteContent['socials']['items']; className?: string }) {
  if (items.length === 0) return null

  return (
    <ul className={cn('flex flex-wrap items-center gap-2', className)}>
      {items.map((item) => {
        const Icon = icons[item.platform]
        const external = /^https?:/i.test(item.url)
        return (
          <li key={`${item.platform}-${item.url}`}>
            <a
              href={item.url}
              aria-label={item.label}
              title={item.label}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="flex size-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Icon className="size-4" aria-hidden />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
