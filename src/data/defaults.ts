import type { SiteContent } from '@/lib/content/schema'

/** Conteúdo por omissão: usado até a dashboard guardar a primeira alteração de cada secção. */
export const defaultContent: SiteContent = {
  general: {
    brandName: 'BillTech',
    author: 'José Lopes',
    seoTitle: 'BillTech | Desenvolvimento para PMEs, Automação e Sistemas sob Medida',
    seoDescription:
      'Desenvolvimento web e mobile para PMEs, automação de processos e sistemas sob medida. Transforme processos manuais em receita digital previsível com a BillTech.',
    keywords: [
      'desenvolvimento para PMEs',
      'desenvolvimento de software para pequenas e médias empresas',
      'automação de processos',
      'automação empresarial',
      'sistemas sob medida',
      'software à medida',
      'aplicações mobile',
      'dashboards e BI',
      'integração WhatsApp',
      'transformação digital',
    ],
    headerCta: 'Fale conosco',
    // Número provisório: 915385517 (Portugal, +351). Editável na dashboard → Geral & SEO.
    whatsappUrl: 'https://wa.me/351915385517?text=Ol%C3%A1%21%20Vim%20pelo%20site%20da%20BillTech%20e%20gostaria%20de%20falar%20com%20a%20equipa.',
    footerText: 'Desenvolvido por José Lopes.',
  },
  hero: {
    badge: 'Soluções Digitais sob Medida para PMEs',
    titleStart: 'Transforme processos manuais em',
    titleHighlight: 'receita digital previsível.',
    subtitle:
      'Desenvolvimento Web, Apps Mobile e Automação de Dados liderados por Engenharia de Software de alto nível. Foque no seu negócio, nós cuidamos da tecnologia.',
    ctaPrimary: 'Solicitar Diagnóstico Digital Gratuito',
    ctaSecondary: 'Ver Projetos',
    stats: [
      { value: '+50', label: 'Projetos Entregues' },
      { value: '40%', label: 'Mais Eficiência Operacional' },
      { value: '< 2h', label: 'Suporte & Resposta' },
    ],
  },
  about: {
    eyebrow: 'Sobre a BillTech',
    titleStart: 'Rigor Acadêmico.',
    titleHighlight: 'Visão de Negócios.',
    body: "Sou José Lopes, Cientista da Computação, Analista de Dados e CEO da BillTech. Não criamos apenas 'sites bonitos'. Unimos arquitetura de software robusta, análise de dados profunda e desenvolvimento ágil para digitalizar operações de PMEs, gerando ROI real e escalabilidade.",
    linkLabel: 'Conheça a nossa abordagem',
    personName: 'José Lopes',
    personRole: 'CEO & Engenheiro de Software',
    photo: {
      src: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
      alt: 'Retrato de José Lopes',
    },
    skills: [
      { label: 'Web', icon: 'globe' },
      { label: 'Mobile', icon: 'smartphone' },
      { label: 'Data', icon: 'database' },
      { label: 'Cloud', icon: 'cloud' },
    ],
    footnote: 'Tecnologia pensada para gerar resultado',
  },
  services: {
    eyebrow: 'O que fazemos',
    titleStart: 'Tecnologia que',
    titleHighlight: 'Opera o Seu Negócio',
    items: [
      { icon: 'globe', title: 'Sistemas Web Sob Medida', text: 'Portais, ERPs leves e e-commerces otimizados para conversão.' },
      { icon: 'smartphone', title: 'Apps Mobile (iOS/Android)', text: 'Aplicações nativas para gestão, fidelização e agendamentos.' },
      { icon: 'chart', title: 'Dashboards & BI', text: 'Painéis de análise de dados para visualizar estoque, vendas e finanças em tempo real.' },
      { icon: 'workflow', title: 'Automação & APIs', text: 'Integração com WhatsApp, automação de pedidos e eliminação de tarefas repetitivas.' },
    ],
  },
  projectsIntro: {
    eyebrow: 'Portfólio',
    title: 'Casos de Sucesso & Projetos Entregues',
    subtitle: 'Deslize para ver como transformamos operações de PMEs. Clique para ver o case completo.',
  },
  sectors: {
    eyebrow: 'Especialização',
    titleStart: 'Especialistas na',
    titleHighlight: 'Sua Realidade',
    items: [
      { title: 'Oficinas', text: 'Controle de ordens de serviço, peças e comunicação automática com o cliente.' },
      { title: 'Restauração', text: 'Gestão de mesas, pedidos via QR Code e controle de desperdício.' },
      { title: 'Comércio/Serviços', text: 'CRM simplificado, faturação digital e vitrine online.' },
    ],
  },
  process: {
    eyebrow: 'Como trabalhamos',
    titleStart: 'Do Diagnóstico ao Lançamento em',
    titleHighlight: '4 Passos',
    steps: [
      { title: 'Diagnóstico', text: 'Mapeamento de gargalos e oportunidades de ROI.' },
      { title: 'Arquitetura', text: 'Design de UX focado em conversão e estrutura de dados.' },
      { title: 'Desenvolvimento', text: 'Código limpo, testes rigorosos e sprints ágeis.' },
      { title: 'Lançamento', text: 'Deploy, treinamento da equipa e suporte contínuo.' },
    ],
  },
  contact: {
    eyebrow: 'Vamos conversar',
    title: 'Pronto para digitalizar a sua operação?',
    text: 'Agende uma reunião estratégica de 30 minutos. Vamos analisar os gargalos do seu negócio e desenhar a solução ideal.',
    whatsappLabel: 'Falar agora no WhatsApp',
    submitLabel: 'Agendar Reunião',
  },
  socials: {
    items: [],
  },
  solutions: {
    items: [
      {
        id: 'pedir-orcamento',
        icon: 'briefcase',
        title: 'Novo projeto',
        description: 'Precisa de um novo sistema, app ou automação? Fale diretamente com a equipa BillTech.',
        url: '/#contato',
        status: 'ativo',
      },
    ],
  },
}
