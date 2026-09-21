import { iconNames } from '@/lib/icons'
import { socialPlatforms, type ContentKey } from '@/lib/content/schema'

/** Descrição declarativa dos formulários da dashboard (serializável, sem funções). */
export type Field =
  | { type: 'text' | 'textarea' | 'url'; name: string; label: string; help?: string }
  | { type: 'boolean'; name: string; label: string; help?: string }
  | { type: 'select'; name: string; label: string; options: { value: string; label: string }[]; help?: string }
  | { type: 'image'; name: string; label: string; folder: string; help?: string }
  | { type: 'images'; name: string; label: string; folder: string; help?: string }
  | { type: 'strings'; name: string; label: string; multiline?: boolean; help?: string }
  | { type: 'list'; name: string; label: string; itemLabel: string; fields: Field[]; help?: string }

const iconOptions = iconNames.map((value) => ({ value, label: value }))
const platformLabels: Record<(typeof socialPlatforms)[number], string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  github: 'GitHub',
  facebook: 'Facebook',
  x: 'X (Twitter)',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  email: 'Email (mailto:)',
  website: 'Website',
}

const headings = (): Field[] => [
  { type: 'text', name: 'eyebrow', label: 'Etiqueta acima do título' },
  { type: 'text', name: 'titleStart', label: 'Título — início' },
  { type: 'text', name: 'titleHighlight', label: 'Título — parte destacada (cor da marca)' },
]

export const contentEditors: Record<ContentKey, { title: string; description: string; fields: Field[] }> = {
  general: {
    title: 'Geral & SEO',
    description: 'Nome da marca, botão do cabeçalho, WhatsApp, rodapé e meta-dados para o Google.',
    fields: [
      { type: 'text', name: 'brandName', label: 'Nome da marca', help: 'Se terminar em "Tech", essa parte aparece na cor da marca.' },
      { type: 'text', name: 'author', label: 'Autor / fundador' },
      { type: 'text', name: 'headerCta', label: 'Texto do botão do cabeçalho' },
      { type: 'url', name: 'whatsappUrl', label: 'Link do WhatsApp', help: 'Ex.: https://wa.me/351912345678 — deixe vazio para esconder o botão.' },
      { type: 'text', name: 'footerText', label: 'Texto do rodapé (depois de "© ano Marca.")' },
      { type: 'text', name: 'seoTitle', label: 'Título SEO (separador e Google)' },
      { type: 'textarea', name: 'seoDescription', label: 'Descrição SEO', help: 'Recomendado: 120–160 caracteres.' },
      { type: 'strings', name: 'keywords', label: 'Palavras-chave' },
    ],
  },
  hero: {
    title: 'Início (Hero)',
    description: 'Cabeçalho principal da página, botões e números em destaque.',
    fields: [
      { type: 'text', name: 'badge', label: 'Selo acima do título' },
      { type: 'text', name: 'titleStart', label: 'Título — início' },
      { type: 'text', name: 'titleHighlight', label: 'Título — parte destacada' },
      { type: 'textarea', name: 'subtitle', label: 'Subtítulo' },
      { type: 'text', name: 'ctaPrimary', label: 'Botão principal' },
      { type: 'text', name: 'ctaSecondary', label: 'Botão secundário' },
      { type: 'list', name: 'stats', label: 'Números em destaque', itemLabel: 'Número', fields: [
        { type: 'text', name: 'value', label: 'Valor (ex.: +50)' },
        { type: 'text', name: 'label', label: 'Descrição' },
      ] },
    ],
  },
  about: {
    title: 'Sobre',
    description: 'Texto, foto e competências.',
    fields: [
      ...headings(),
      { type: 'textarea', name: 'body', label: 'Texto' },
      { type: 'text', name: 'linkLabel', label: 'Texto do link' },
      { type: 'text', name: 'personName', label: 'Nome da pessoa' },
      { type: 'text', name: 'personRole', label: 'Cargo' },
      { type: 'image', name: 'photo', label: 'Fotografia', folder: 'about' },
      { type: 'list', name: 'skills', label: 'Competências', itemLabel: 'Competência', fields: [
        { type: 'text', name: 'label', label: 'Nome' },
        { type: 'select', name: 'icon', label: 'Ícone', options: iconOptions },
      ] },
      { type: 'text', name: 'footnote', label: 'Frase final' },
    ],
  },
  services: {
    title: 'Serviços',
    description: 'Cartões da secção "O que fazemos".',
    fields: [
      ...headings(),
      { type: 'list', name: 'items', label: 'Serviços', itemLabel: 'Serviço', fields: [
        { type: 'select', name: 'icon', label: 'Ícone', options: iconOptions },
        { type: 'text', name: 'title', label: 'Título' },
        { type: 'textarea', name: 'text', label: 'Descrição' },
      ] },
    ],
  },
  projectsIntro: {
    title: 'Projetos — cabeçalho',
    description: 'Textos acima do carrossel. Os projetos em si editam-se em "Projetos".',
    fields: [
      { type: 'text', name: 'eyebrow', label: 'Etiqueta' },
      { type: 'text', name: 'title', label: 'Título' },
      { type: 'textarea', name: 'subtitle', label: 'Subtítulo' },
    ],
  },
  sectors: {
    title: 'Setores',
    description: 'Separadores "Especialistas na sua realidade".',
    fields: [
      ...headings(),
      { type: 'list', name: 'items', label: 'Setores', itemLabel: 'Setor', fields: [
        { type: 'text', name: 'title', label: 'Nome' },
        { type: 'textarea', name: 'text', label: 'Descrição' },
      ] },
    ],
  },
  process: {
    title: 'Processo',
    description: 'Passos "Como trabalhamos" (numerados automaticamente).',
    fields: [
      ...headings(),
      { type: 'list', name: 'steps', label: 'Passos', itemLabel: 'Passo', fields: [
        { type: 'text', name: 'title', label: 'Título' },
        { type: 'textarea', name: 'text', label: 'Descrição' },
      ] },
    ],
  },
  contact: {
    title: 'Contacto',
    description: 'Textos da secção de contacto e do formulário.',
    fields: [
      { type: 'text', name: 'eyebrow', label: 'Etiqueta' },
      { type: 'text', name: 'title', label: 'Título' },
      { type: 'textarea', name: 'text', label: 'Texto' },
      { type: 'text', name: 'whatsappLabel', label: 'Texto do botão WhatsApp' },
      { type: 'text', name: 'submitLabel', label: 'Texto do botão de envio' },
    ],
  },
  socials: {
    title: 'Redes sociais',
    description: 'Ícones no rodapé. Adicione, ordene ou remova redes.',
    fields: [
      { type: 'list', name: 'items', label: 'Redes', itemLabel: 'Rede', fields: [
        { type: 'select', name: 'platform', label: 'Plataforma', options: socialPlatforms.map((p) => ({ value: p, label: platformLabels[p] })) },
        { type: 'text', name: 'label', label: 'Texto acessível (ex.: LinkedIn da BillTech)' },
        { type: 'url', name: 'url', label: 'Link' },
      ] },
    ],
  },
  solutions: {
    title: 'Soluções para clientes',
    description: 'Catálogo mostrado na área de cliente. Atribua cada solução a clientes em "Clientes".',
    fields: [
      { type: 'list', name: 'items', label: 'Soluções', itemLabel: 'Solução', fields: [
        { type: 'text', name: 'id', label: 'Identificador único', help: 'Minúsculas, números e hífenes. Não mude depois de atribuir a clientes.' },
        { type: 'select', name: 'icon', label: 'Ícone', options: iconOptions },
        { type: 'text', name: 'title', label: 'Título' },
        { type: 'textarea', name: 'description', label: 'Descrição' },
        { type: 'url', name: 'url', label: 'Link de acesso (opcional)' },
        { type: 'select', name: 'status', label: 'Estado', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'em-breve', label: 'Em breve' }] },
      ] },
    ],
  },
}

export const projectFields: Field[] = [
  { type: 'boolean', name: 'published', label: 'Publicado no site' },
  { type: 'text', name: 'title', label: 'Nome do projeto' },
  { type: 'text', name: 'slug', label: 'Endereço (slug)', help: 'Aparece no URL: /projetos/este-endereco' },
  { type: 'text', name: 'tag', label: 'Setor (selo)' },
  { type: 'textarea', name: 'summary', label: 'Resumo (cartão do carrossel e SEO)' },
  { type: 'image', name: 'cover', label: 'Imagem de capa', folder: 'projects' },
  { type: 'images', name: 'gallery', label: 'Galeria', folder: 'projects' },
  { type: 'text', name: 'client', label: 'Cliente' },
  { type: 'text', name: 'duration', label: 'Duração' },
  { type: 'strings', name: 'services', label: 'Serviços prestados' },
  { type: 'strings', name: 'stack', label: 'Tecnologias' },
  { type: 'strings', name: 'challenge', label: 'O Desafio (um parágrafo por linha)', multiline: true },
  { type: 'strings', name: 'solution', label: 'A Solução (um parágrafo por linha)', multiline: true },
  { type: 'strings', name: 'features', label: 'Funcionalidades' },
  { type: 'list', name: 'results', label: 'Resultados', itemLabel: 'Resultado', fields: [
    { type: 'text', name: 'metric', label: 'Métrica (ex.: -30%)' },
    { type: 'text', name: 'label', label: 'Descrição' },
  ] },
  { type: 'textarea', name: 'roi', label: 'Texto de ROI' },
]

export const emptyProject = {
  slug: '',
  published: false,
  title: '',
  tag: '',
  summary: '',
  cover: { src: '', alt: '' },
  gallery: [],
  client: '',
  duration: '',
  services: [],
  stack: [],
  challenge: [''],
  solution: [''],
  features: [],
  results: [],
  roi: '',
}
