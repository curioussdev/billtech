import 'server-only'
import { cache } from 'react'
import { defaultContent } from '@/data/defaults'
import { defaultProjects } from '@/data/projects'
import { contentKeys, contentSchemas, projectSchema, type Project, type SiteContent } from '@/lib/content/schema'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createPublicClient } from '@/lib/supabase/server'

/**
 * Conteúdo público. Usa um cliente sem cookies para as páginas continuarem estáticas;
 * a dashboard invalida-as com revalidatePath ao guardar.
 * Qualquer falha (sem chaves, rede, valor inválido) cai no conteúdo por omissão.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  if (!isSupabaseConfigured) return defaultContent

  try {
    const { data, error } = await createPublicClient().from('site_content').select('key, value')
    if (error || !data) return defaultContent

    const content = { ...defaultContent } as Record<string, unknown>
    for (const row of data) {
      const key = row.key as keyof typeof contentSchemas
      if (!contentKeys.includes(key)) continue
      const parsed = contentSchemas[key].safeParse(row.value)
      if (parsed.success) content[key] = parsed.data
      else console.warn(`[content] Secção "${key}" inválida na base de dados; a usar valor por omissão.`)
    }
    return content as SiteContent
  } catch (error) {
    console.error('[content] Falha a ler site_content:', error)
    return defaultContent
  }
})

function rowToProject(row: { slug: string; published: boolean; data: unknown }): Project | null {
  const parsed = projectSchema.safeParse({ ...(row.data as object), slug: row.slug, published: row.published })
  if (!parsed.success) {
    console.warn(`[content] Projeto "${row.slug}" inválido; ignorado.`)
    return null
  }
  return parsed.data
}

/** Projetos publicados, por ordem. Sem linhas na base de dados mostra os exemplos por omissão. */
export const getProjects = cache(async (): Promise<Project[]> => {
  if (!isSupabaseConfigured) return defaultProjects

  try {
    const { data, error } = await createPublicClient()
      .from('projects')
      .select('slug, published, data')
      .eq('published', true)
      .order('position', { ascending: true })
    if (error || !data) return defaultProjects
    if (data.length === 0) return defaultProjects
    return data.map(rowToProject).filter((p): p is Project => p !== null)
  } catch (error) {
    console.error('[content] Falha a ler projects:', error)
    return defaultProjects
  }
})

export const getProject = cache(async (slug: string) => (await getProjects()).find((p) => p.slug === slug))

export { rowToProject }
