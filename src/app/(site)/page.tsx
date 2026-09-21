import { About } from '@/components/sections/about'
import { Contact } from '@/components/sections/contact'
import { Hero } from '@/components/sections/hero'
import { Process } from '@/components/sections/process'
import { ProjectsCarousel } from '@/components/sections/projects-carousel'
import { Sectors } from '@/components/sections/sectors'
import { Services } from '@/components/sections/services'
import { siteUrl } from '@/data/site'
import { getProjects, getSiteContent } from '@/lib/content/get'

// Rede de segurança: a dashboard já invalida esta página ao guardar (revalidatePath)
export const revalidate = 300

export default async function Page() {
  const [content, projects] = await Promise.all([getSiteContent(), getProjects()])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: content.general.brandName,
    url: siteUrl,
    description: content.general.seoDescription,
    founder: { '@type': 'Person', name: content.general.author },
    areaServed: 'PT',
    knowsAbout: content.general.keywords,
    sameAs: content.socials.items.filter((s) => /^https?:/i.test(s.url)).map((s) => s.url),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Hero content={content.hero} />
      <About content={content.about} />
      <Services content={content.services} />
      <ProjectsCarousel intro={content.projectsIntro} projects={projects} />
      <Sectors content={content.sectors} />
      <Process content={content.process} />
      <Contact content={content.contact} whatsappUrl={content.general.whatsappUrl} />
    </>
  )
}
