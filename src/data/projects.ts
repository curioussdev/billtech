import type { Project } from '@/lib/content/schema'

const unsplash = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

/**
 * ATENÇÃO: conteúdo ilustrativo. Apenas o "-30% de tempo administrativo" do
 * DataClinic veio do mock original — substituir textos, métricas e imagens
 * pelos dados reais de cada cliente antes de publicar.
 */
export const defaultProjects: Project[] = [
  {
    slug: 'autocenter-pro',
    published: true,
    title: 'AutoCenter Pro',
    tag: 'Oficina Mecânica',
    summary: 'Sistema de agendamento e histórico de reparos com aviso automático via WhatsApp.',
    cover: { src: unsplash('1487754180451-c456f719a1fc'), alt: 'Componentes de motor numa oficina mecânica' },
    gallery: [
      { src: unsplash('1486262715619-67b85e0b08d3'), alt: 'Detalhe de um motor durante uma revisão' },
      { src: unsplash('1517245386807-bb43f82c33c4'), alt: 'Reunião de equipa a rever o painel de agendamentos' },
      { src: unsplash('1460925895917-afdab827c52f'), alt: 'Painel com indicadores de ocupação da oficina' },
    ],
    client: 'Oficina multimarca (PME)',
    duration: '10 semanas',
    services: ['Sistema Web sob medida', 'Automação WhatsApp'],
    stack: ['Next.js', 'PostgreSQL', 'WhatsApp Business API'],
    challenge: [
      'A oficina geria marcações em papel e mensagens soltas de WhatsApp. Havia sobreposição de horários, clientes que esqueciam a revisão e nenhum histórico centralizado dos veículos.',
      'Cada ordem de serviço dependia da memória da equipa, o que gerava retrabalho, atrasos na entrega e perda de receita recorrente.',
    ],
    solution: [
      'Desenvolvemos um sistema web com agenda por bancada, ficha digital por veículo e histórico completo de reparações e peças aplicadas.',
      'Integrámos a API do WhatsApp para confirmar marcações, avisar quando o veículo está pronto e lembrar automaticamente revisões periódicas.',
    ],
    features: [
      'Agenda por bancada com deteção de conflitos',
      'Histórico de reparações por matrícula',
      'Avisos automáticos via WhatsApp',
      'Orçamentos e ordens de serviço digitais',
    ],
    results: [
      { metric: '-60%', label: 'faltas a marcações' },
      { metric: '+25%', label: 'revisões recorrentes' },
      { metric: '8 h', label: 'poupadas por semana em administrativo' },
    ],
    roi: 'Retorno do investimento estimado em menos de 5 meses, através da redução de faltas e do aumento de revisões recorrentes.',
  },
  {
    slug: 'gastroflow',
    published: true,
    title: 'GastroFlow',
    tag: 'Restauração',
    summary: 'Menu digital integrado ao PDV e programa de fidelização para clientes recorrentes.',
    cover: { src: unsplash('1556740758-90de374c12ad'), alt: 'Equipa de restauração a preparar pratos' },
    gallery: [
      { src: unsplash('1504674900247-0877df9cc836'), alt: 'Pratos servidos à mesa num restaurante' },
      { src: unsplash('1414235077428-338989a2e8c0'), alt: 'Mesa de restaurante com prato de autor' },
      { src: unsplash('1517245386807-bb43f82c33c4'), alt: 'Equipa a analisar relatórios de vendas' },
    ],
    client: 'Grupo de restauração (2 unidades)',
    duration: '8 semanas',
    services: ['Sistema Web sob medida', 'Integração PDV', 'Fidelização'],
    stack: ['Next.js', 'Supabase', 'Integração PDV via API'],
    challenge: [
      'Menus em papel desatualizados, pedidos anotados à mão e nenhuma visibilidade sobre quais clientes voltavam ou o que consumiam.',
      'O controlo de desperdício era feito no fim do mês, tarde demais para corrigir compras e receitas.',
    ],
    solution: [
      'Criámos um menu digital acessível por QR Code, ligado diretamente ao PDV, com atualização de preços e disponibilidade em tempo real.',
      'Adicionámos um programa de fidelização por telemóvel e um painel diário com vendas por prato e desperdício estimado.',
    ],
    features: [
      'Menu digital por QR Code, sempre atualizado',
      'Pedidos enviados diretamente ao PDV',
      'Cartão de fidelização digital',
      'Painel diário de vendas e desperdício',
    ],
    results: [
      { metric: '+18%', label: 'clientes recorrentes' },
      { metric: '-22%', label: 'desperdício alimentar' },
      { metric: '+12%', label: 'ticket médio' },
    ],
    roi: 'Payback estimado em cerca de 4 meses, impulsionado pela fidelização e pela redução de desperdício.',
  },
  {
    slug: 'dataclinic',
    published: true,
    title: 'DataClinic',
    tag: 'Clínica/Serviços',
    summary: 'Dashboard financeiro e de agendamentos que reduziu o tempo administrativo em 30%.',
    cover: { src: unsplash('1551288049-bebda4e38f71'), alt: 'Painel de análise de dados num ecrã' },
    gallery: [
      { src: unsplash('1576091160399-112ba8d25d1d'), alt: 'Profissional de saúde a consultar uma aplicação no telemóvel' },
      { src: unsplash('1460925895917-afdab827c52f'), alt: 'Dashboard financeiro com gráficos de faturação' },
      { src: unsplash('1517245386807-bb43f82c33c4'), alt: 'Reunião de gestão a analisar indicadores' },
    ],
    client: 'Clínica multidisciplinar',
    duration: '12 semanas',
    services: ['Dashboards & BI', 'Sistema Web sob medida'],
    stack: ['Next.js', 'PostgreSQL', 'Gráficos customizados'],
    challenge: [
      'Dados de faturação, marcações e faltas espalhados por folhas de cálculo e sistemas que não comunicavam entre si.',
      'A gestão gastava horas a consolidar relatórios mensais e decidia com informação já desatualizada.',
    ],
    solution: [
      'Centralizámos as fontes de dados num único modelo e construímos um dashboard com faturação, taxa de ocupação e faltas por especialidade.',
      'Automatizámos os relatórios recorrentes, que passaram a chegar por email à gestão sem intervenção manual.',
    ],
    features: [
      'Dashboard financeiro em tempo real',
      'Ocupação e faltas por especialidade',
      'Relatórios automáticos por email',
      'Permissões por perfil de utilizador',
    ],
    results: [
      { metric: '-30%', label: 'tempo administrativo' },
      { metric: '5 min', label: 'para fechar o relatório mensal (antes: 1 dia)' },
      { metric: '+15%', label: 'taxa de ocupação' },
    ],
    roi: 'A redução de 30% no tempo administrativo liberta horas de equipa para atendimento, com retorno estimado em cerca de 6 meses.',
  },
  {
    slug: 'retailhub',
    published: true,
    title: 'RetailHub',
    tag: 'Comércio',
    summary: 'Loja online sincronizada com o stock físico e faturação certificada num único painel.',
    cover: { src: unsplash('1441986300917-64674bd600d8'), alt: 'Interior de uma loja de roupa com prateleiras e iluminação suspensa' },
    gallery: [
      { src: unsplash('1556740738-b6a63e27c4df'), alt: 'Colaboradora a receber um pagamento num terminal de venda' },
      { src: unsplash('1460925895917-afdab827c52f'), alt: 'Painel de vendas e stock num portátil' },
      { src: unsplash('1517245386807-bb43f82c33c4'), alt: 'Reunião de equipa sobre o plano de vendas' },
    ],
    client: 'Loja de moda com 2 pontos de venda',
    duration: '11 semanas',
    services: ['E-commerce', 'Integração de stock', 'Faturação digital'],
    stack: ['Next.js', 'PostgreSQL', 'Stripe', 'API de faturação'],
    challenge: [
      'O stock da loja física e da loja online era gerido em folhas separadas, o que causava vendas de artigos sem existências e devoluções.',
      'A faturação era feita à mão no fim do dia, com erros frequentes e sem visão do que vendia melhor.',
    ],
    solution: [
      'Construímos uma loja online ligada ao mesmo stock do ponto de venda, com atualização imediata a cada venda em qualquer canal.',
      'A faturação passou a ser emitida automaticamente e o painel mostra vendas, margens e artigos parados em tempo real.',
    ],
    features: [
      'Stock único entre loja física e online',
      'Faturação emitida automaticamente',
      'Painel de vendas e margens',
      'Alertas de rutura de stock',
    ],
    results: [
      { metric: '+35%', label: 'vendas online no primeiro semestre' },
      { metric: '-80%', label: 'erros de stock' },
      { metric: '6 h', label: 'poupadas por semana em faturação' },
    ],
    roi: 'Retorno estimado em cerca de 7 meses, com o aumento das vendas online e a eliminação de trabalho manual de faturação.',
  },
  {
    slug: 'fitbook',
    published: true,
    title: 'FitBook',
    tag: 'Ginásios & Bem-estar',
    summary: 'App de reservas de aulas e gestão de mensalidades com lembretes automáticos.',
    cover: { src: unsplash('1534438327276-14e5300c3a48'), alt: 'Sala de musculação com halteres e cliente a treinar' },
    gallery: [
      { src: unsplash('1576091160399-112ba8d25d1d'), alt: 'Pessoa a usar a aplicação de reservas no telemóvel' },
      { src: unsplash('1460925895917-afdab827c52f'), alt: 'Painel de ocupação das aulas' },
      { src: unsplash('1517245386807-bb43f82c33c4'), alt: 'Equipa do ginásio a rever indicadores de adesão' },
    ],
    client: 'Ginásio independente',
    duration: '9 semanas',
    services: ['App Mobile', 'Automação', 'Dashboards & BI'],
    stack: ['React Native', 'Supabase', 'Stripe', 'Notificações push'],
    challenge: [
      'As reservas de aulas eram feitas por mensagem e as mensalidades controladas em papel, com muitos atrasos de pagamento.',
      'Sem dados de ocupação, a direção não sabia que aulas manter, nem que horários reforçar.',
    ],
    solution: [
      'Criámos uma app onde os sócios reservam aulas, recebem lembretes e pagam a mensalidade, com lista de espera automática.',
      'A direção acompanha ocupação, cancelamentos e receita recorrente num dashboard simples.',
    ],
    features: [
      'Reserva de aulas com lista de espera',
      'Pagamento automático de mensalidades',
      'Lembretes por notificação push',
      'Dashboard de ocupação e retenção',
    ],
    results: [
      { metric: '-45%', label: 'faltas às aulas' },
      { metric: '-70%', label: 'atrasos de pagamento' },
      { metric: '+20%', label: 'ocupação média das aulas' },
    ],
    roi: 'Payback estimado em cerca de 5 meses, com menos atrasos de pagamento e melhor aproveitamento das aulas.',
  },
  {
    slug: 'imogest',
    published: true,
    title: 'ImoGest',
    tag: 'Imobiliário',
    summary: 'CRM de imóveis e leads com portal de propostas para clientes e proprietários.',
    cover: { src: unsplash('1560518883-ce09059eeffa'), alt: 'Miniatura de casa com chaves sobre uma mesa' },
    gallery: [
      { src: unsplash('1517245386807-bb43f82c33c4'), alt: 'Reunião com clientes sobre uma proposta' },
      { src: unsplash('1460925895917-afdab827c52f'), alt: 'Painel de leads e visitas agendadas' },
      { src: unsplash('1556740738-b6a63e27c4df'), alt: 'Assinatura digital de uma proposta num tablet' },
    ],
    client: 'Mediadora imobiliária local',
    duration: '10 semanas',
    services: ['CRM sob medida', 'Portal de cliente', 'Automação'],
    stack: ['Next.js', 'PostgreSQL', 'Email e WhatsApp automáticos'],
    challenge: [
      'Os contactos de interessados chegavam por vários canais e perdiam-se, sem registo de quem já tinha visitado cada imóvel.',
      'Propostas e documentos circulavam por email, com versões desencontradas e atrasos no fecho de negócio.',
    ],
    solution: [
      'Centralizámos leads e imóveis num CRM, com atribuição automática ao consultor e agendamento de visitas.',
      'Criámos um portal onde clientes e proprietários consultam propostas e documentos e aprovam online.',
    ],
    features: [
      'CRM de leads e imóveis',
      'Agendamento de visitas com lembretes',
      'Portal de propostas e documentos',
      'Relatório de desempenho por consultor',
    ],
    results: [
      { metric: '+28%', label: 'leads contactados em menos de 1 hora' },
      { metric: '-30%', label: 'tempo até ao fecho de negócio' },
      { metric: '0', label: 'documentos perdidos desde o arranque' },
    ],
    roi: 'Retorno estimado em cerca de 6 meses, com mais negócios fechados por lead e menos tempo em tarefas administrativas.',
  },
  {
    slug: 'logitrack',
    published: true,
    title: 'LogiTrack',
    tag: 'Logística',
    summary: 'Controlo de armazém e encomendas com leitura de códigos e painel de expedição.',
    cover: { src: unsplash('1586528116311-ad8dd3c8310d'), alt: 'Armazém com estantes e caixas organizadas' },
    gallery: [
      { src: unsplash('1460925895917-afdab827c52f'), alt: 'Painel de expedição com indicadores diários' },
      { src: unsplash('1517245386807-bb43f82c33c4'), alt: 'Equipa de logística a planear as rotas do dia' },
      { src: unsplash('1556740738-b6a63e27c4df'), alt: 'Leitura de código de barras numa receção de mercadoria' },
    ],
    client: 'Distribuidora regional',
    duration: '14 semanas',
    services: ['Sistema Web sob medida', 'App Mobile', 'Dashboards & BI'],
    stack: ['Next.js', 'PostgreSQL', 'Leitura de códigos por telemóvel'],
    challenge: [
      'O armazém funcionava com listas impressas e contagens manuais, o que gerava enganos nas expedições e inventários demorados.',
      'A gestão só percebia atrasos nas entregas quando o cliente reclamava.',
    ],
    solution: [
      'Desenvolvemos uma app de armazém que lê códigos de barras para receber, arrumar e expedir mercadoria, com inventário contínuo.',
      'Um painel mostra encomendas por estado e alerta antecipadamente as que estão em risco de atraso.',
    ],
    features: [
      'Receção e expedição por leitura de códigos',
      'Inventário contínuo sem paragens',
      'Estado das encomendas em tempo real',
      'Alertas de atraso de entrega',
    ],
    results: [
      { metric: '-65%', label: 'erros de expedição' },
      { metric: '-50%', label: 'tempo de inventário' },
      { metric: '+18%', label: 'entregas dentro do prazo' },
    ],
    roi: 'Retorno estimado em cerca de 8 meses, com menos devoluções e menos horas gastas em inventário.',
  },
]

