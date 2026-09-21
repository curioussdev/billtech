import { Footer } from '@/components/sections/footer'
import { Header } from '@/components/sections/header'
import { getSiteContent } from '@/lib/content/get'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { general, socials } = await getSiteContent()

  return (
    <>
      <a
        href="#conteudo"
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground transition-transform focus:translate-y-0"
      >
        Saltar para o conteúdo
      </a>
      <Header brandName={general.brandName} ctaLabel={general.headerCta} />
      <main id="conteudo" className="min-h-screen overflow-x-clip">
        {children}
      </main>
      <Footer general={general} socials={socials} />
    </>
  )
}
