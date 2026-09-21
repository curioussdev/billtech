import type { MetadataRoute } from 'next'
import { siteUrl } from '@/data/site'
import { getProjects } from '@/lib/content/get'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjects()
  return [
    { url: siteUrl, changeFrequency: 'monthly', priority: 1 },
    ...projects.map((project) => ({
      url: `${siteUrl}/projetos/${project.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
