import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { MotionProvider } from '@/components/motion/motion-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { siteLocale, siteUrl } from '@/data/site'
import { getSiteContent } from '@/lib/content/get'
import { buildThemeOverrideCss } from '@/lib/theme/css'
import { getThemePalette } from '@/lib/theme/get'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export async function generateMetadata(): Promise<Metadata> {
  const { general } = await getSiteContent()

  return {
    metadataBase: new URL(siteUrl),
    title: { default: general.seoTitle, template: `%s | ${general.brandName}` },
    description: general.seoDescription,
    keywords: general.keywords,
    applicationName: general.brandName,
    authors: [{ name: general.author }],
    creator: general.author,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: siteLocale,
      siteName: general.brandName,
      title: general.seoTitle,
      description: general.seoDescription,
      url: '/',
    },
    twitter: { card: 'summary_large_image', title: general.seoTitle, description: general.seoDescription },
    robots: { index: true, follow: true },
    icons: {
      icon: [
        { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
        { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
        { url: '/icon.svg', type: 'image/svg+xml' },
      ],
      apple: '/apple-icon.png',
    },
  }
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2fdfb' },
    { media: '(prefers-color-scheme: dark)', color: '#000e0d' },
  ],
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Nunca pode impedir a página de renderizar — uma falha aqui (Supabase em baixo, etc.) tem de cair
  // graciosamente para "sem personalização", nunca para uma página em branco.
  let themeCss = ''
  try {
    themeCss = buildThemeOverrideCss(await getThemePalette())
  } catch (error) {
    console.error('[theme] Falha a aplicar a paleta personalizada:', error)
  }

  return (
    // suppressHydrationWarning: next-themes altera a classe do <html> antes da hidratação
    <html lang="pt-PT" className={inter.variable} suppressHydrationWarning>
      <body>
        {themeCss && <style dangerouslySetInnerHTML={{ __html: themeCss }} />}
        <ThemeProvider>
          <MotionProvider>{children}</MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
