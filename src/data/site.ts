/** Constantes técnicas (não editáveis na dashboard). O conteúdo editável vive em `defaults.ts`. */
/**
 * URL público do site. Tolerante a valores vazios/inválidos (na Vercel uma variável pode existir mas estar em branco):
 * NEXT_PUBLIC_SITE_URL → domínio de produção da Vercel → URL do deploy → localhost.
 */
function resolveSiteUrl(): string {
  const candidates = [process.env.NEXT_PUBLIC_SITE_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL]
  for (const raw of candidates) {
    const value = raw?.trim()
    if (!value) continue
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
    try {
      return new URL(withProtocol).origin
    } catch {
      // valor inválido: tenta o próximo
    }
  }
  return 'http://localhost:3000'
}

export const siteUrl = resolveSiteUrl()
export const siteLocale = 'pt_PT'

/** Email que recebe as mensagens do formulário quando ainda não foi definido na dashboard. */
export const DEFAULT_CONTACT_EMAIL = '946393361bill@gmail.com'

export const navLinks = [
  { href: '/#solucoes', label: 'Soluções' },
  { href: '/#setores', label: 'Setores' },
  { href: '/#projetos', label: 'Projetos' },
  { href: '/#sobre', label: 'Sobre' },
] as const
