/** Constantes técnicas (não editáveis na dashboard). O conteúdo editável vive em `defaults.ts`. */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
export const siteLocale = 'pt_PT'

/** Email que recebe as mensagens do formulário quando ainda não foi definido na dashboard. */
export const DEFAULT_CONTACT_EMAIL = '946393361bill@gmail.com'

export const navLinks = [
  { href: '/#solucoes', label: 'Soluções' },
  { href: '/#setores', label: 'Setores' },
  { href: '/#projetos', label: 'Projetos' },
  { href: '/#sobre', label: 'Sobre' },
] as const
