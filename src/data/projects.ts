import type { Project } from '@/lib/content/schema'

/** Imagens do case Frisos Pneus, no Storage do Supabase (bucket público site-media). */
const FRISOS_MEDIA = 'https://tdyoddidwfpaphbnbehf.supabase.co/storage/v1/object/public/site-media/projects/frisos-pneus'

/** Imagens do case O Petisqueiro (fotografias do próprio restaurante). */
const PETISQUEIRO_MEDIA = 'https://tdyoddidwfpaphbnbehf.supabase.co/storage/v1/object/public/site-media/projects/petisqueiro'

/** Imagens do case Tapa Bucho (fotografias do próprio gastrobar). */
const TAPA_BUCHO_MEDIA = 'https://tdyoddidwfpaphbnbehf.supabase.co/storage/v1/object/public/site-media/projects/tapa-bucho'

const unsplash = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

/**
 * ATENÇÃO: os cases Frisos Pneus, O Petisqueiro, Tapa Bucho e Maison Glow são REAIS (clientes e sites
 * existentes), e por isso não têm métricas nem ROI inventados. O Maison Glow usa fotografias de stock
 * (Unsplash), tal como o protótipo original do cliente — ainda não tem fotografias próprias do espaço
 * ou da Vivian a trabalhar; substituir assim que existirem. Os restantes são ilustrativos:
 * apenas o "-30% de tempo administrativo" do DataClinic veio do mock original — substituir
 * textos, métricas e imagens pelos dados reais de cada cliente antes de publicar.
 */
export const defaultProjects: Project[] = [
  {
    slug: 'frisos-pneus',
    published: true,
    websiteUrl: 'https://frisospneus.pt',
    title: 'Frisos Pneus',
    tag: 'Pneus & Assistência Automóvel',
    summary: 'Website para uma oficina de pneus e reboque 24h em Lisboa, pensado para quem precisa de ajuda rápida: ligar, agendar e chegar.',
    cover: { src: `${FRISOS_MEDIA}/oficina.webp`, alt: 'Interior da oficina Frisos Pneus com pneus em stock, equipamento de montagem e elevador' },
    gallery: [
      { src: `${FRISOS_MEDIA}/montagem.webp`, alt: 'Mecânico de luvas laranja a montar um pneu Continental numa máquina de pneus' },
      { src: `${FRISOS_MEDIA}/diagnostico.webp`, alt: 'Técnico a usar um tablet de diagnóstico eletrónico dentro de um automóvel' },
      { src: `${FRISOS_MEDIA}/logo.webp`, alt: 'Logótipo da Frisos Pneus — Assistência e Eficiência' },
    ],
    client: 'Frisos Pneus · São João da Talha, Lisboa',
    duration: '',
    services: ['Website institucional', 'Agendamento e contacto direto', 'SEO local'],
    stack: [],
    showStack: false,
    challenge: [
      'A Frisos Pneus tem um diferencial forte: oficina aberta até à meia-noite, reboque 24 horas e atendimento sem marcação. Mas quem precisa de ajuda urgente procura no telemóvel e decide em segundos.',
      'Era preciso comunicar depressa o que a oficina faz, onde fica e como falar com ela, transmitindo a confiança de uma equipa que resolve quando o resto fecha.',
    ],
    solution: [
      'Criámos um website rápido e direto, com o contacto de urgência sempre à vista, o botão para agendar serviço e a lista completa de serviços: pneus novos e usados, manutenção rápida, diagnóstico eletrónico e reboque 24h.',
      'Mostrámos a oficina, o equipamento e a equipa a trabalhar, e reunimos as avaliações dos clientes para dar confiança antes do primeiro contacto. A otimização para pesquisa local ajuda quem procura pneus ou reboque perto de São João da Talha a encontrar a oficina.',
    ],
    features: [
      'Contacto de urgência e agendamento em destaque',
      'Serviços: pneus, manutenção rápida, diagnóstico e reboque 24h',
      'Galeria da oficina e do trabalho da equipa',
      'Avaliações de clientes em destaque',
      'Horário e morada de fácil acesso',
    ],
    results: [],
    roi: '',
  },
  {
    slug: 'petisqueiro',
    published: true,
    websiteUrl: 'https://petisqueiro-8h0inizse-jos-lopes-projects.vercel.app/',
    title: 'O Petisqueiro',
    tag: 'Restaurante · Cozinha luso-angolana',
    summary:
      'Website para um restaurante de cozinha luso-angolana em Lisboa, feito para mostrar a comida como ela é e levar quem procura sabores de casa até à mesa.',
    cover: {
      src: `${PETISQUEIRO_MEDIA}/prato-completo.webp`,
      alt: 'Refeição servida em louça de barro: peixe com kizaca, funge e feijão de óleo de palma',
    },
    gallery: [
      { src: `${PETISQUEIRO_MEDIA}/muamba-galinha.webp`, alt: 'Muamba de galinha com quiabos, servida numa panela de barro' },
      { src: `${PETISQUEIRO_MEDIA}/muamba-ginguba.webp`, alt: 'Carne estufada com quiabos em molho de ginguba, em panela de barro' },
      { src: `${PETISQUEIRO_MEDIA}/kizaca.webp`, alt: 'Kizaca — folhas de mandioca estufadas — numa panela de barro com tampa' },
      { src: `${PETISQUEIRO_MEDIA}/peixe-grelhado.webp`, alt: 'Peixe grelhado inteiro com banana-pão e molho de cebola e salsa' },
      { src: `${PETISQUEIRO_MEDIA}/panelas-barro.webp`, alt: 'Três panelas de barro com muamba de galinha, carne e kizaca' },
      { src: `${PETISQUEIRO_MEDIA}/mesa-posta.webp`, alt: 'Mesa posta com panelas de barro, farinha de mandioca, molho e vinho' },
      { src: `${PETISQUEIRO_MEDIA}/peixe-kizaca.webp`, alt: 'Prato de peixe com kizaca e quiabos, com funge ao fundo' },
      { src: `${PETISQUEIRO_MEDIA}/partilha-mesa.webp`, alt: 'Refeição partilhada à mesa, com as panelas de barro ao centro' },
    ],
    client: 'O Petisqueiro · Rua Quirino da Fonseca 24B, Arroios, Lisboa',
    duration: '',
    services: ['Website institucional', 'Menu online', 'Reservas e contacto direto', 'SEO local'],
    stack: [],
    showStack: false,
    challenge: [
      'O Petisqueiro é conhecido por quem já lá entrou: cozinha luso-angolana genuína, pratos de conforto como a moamba, a cachupa e as feijoadas, e um ambiente familiar que sabe a casa. Mas quem procura este tipo de comida em Lisboa procura no telemóvel e decide pela fotografia.',
      'Sem presença online, o restaurante dependia do passa-palavra e de quem passava à porta, ficando de fora das pesquisas de quem anda à procura de comida angolana na zona da Alameda e do Areeiro.',
    ],
    solution: [
      'Criámos um website simples e rápido, construído à volta da comida: fotografias reais dos pratos servidos nas panelas de barro, o menu sempre acessível e o contacto para reservar sempre à mão.',
      'A morada, o horário e as indicações de como chegar ficaram em destaque, e o site foi otimizado para pesquisa local, para aparecer a quem procura cozinha angolana ou um almoço tradicional em Arroios.',
    ],
    features: [
      'Menu com os pratos da casa e especialidades angolanas',
      'Reserva e contacto direto em destaque',
      'Galeria de fotografias reais dos pratos',
      'Morada, horário e indicações de como chegar',
      'Pensado primeiro para telemóvel',
    ],
    results: [],
    roi: '',
  },
  {
    slug: 'tapa-bucho',
    published: true,
    websiteUrl: 'https://tapabucho-953ozesub-abbisstore86-3308.vercel.app/',
    title: 'Tapa Bucho',
    tag: 'Restaurante · Gastrobar',
    summary:
      'Website para um gastrobar de referência no Bairro Alto, em Lisboa, pensado para mostrar os petiscos como protagonistas e converter quem navega em reserva.',
    cover: {
      src: `${TAPA_BUCHO_MEDIA}/sandes-assinatura.jpg`,
      alt: 'Sandes assinatura do Tapa Bucho servida numa tábua de madeira com o logótipo do gastrobar',
    },
    gallery: [
      { src: `${TAPA_BUCHO_MEDIA}/sala-interior.webp`, alt: 'Sala interior do Tapa Bucho, com parede de tijolo, candeeiros suspensos e balcão de bebidas' },
      { src: `${TAPA_BUCHO_MEDIA}/esplanada.webp`, alt: 'Esplanada do Tapa Bucho ao final da tarde, com luzes decorativas e mesas postas' },
      { src: `${TAPA_BUCHO_MEDIA}/mesa-partilhada.webp`, alt: 'Mesa cheia de petiscos para partilhar: croquetes, pimentos padrón, entrecosto e tártaro' },
      { src: `${TAPA_BUCHO_MEDIA}/tartare-atum-presunto.webp`, alt: 'Tártaro de atum com presunto ibérico servido à parte, sobre a mesa de madeira' },
      { src: `${TAPA_BUCHO_MEDIA}/croquetes.webp`, alt: 'Croquetes crocantes com molho, dispostos numa travessa comprida' },
      { src: `${TAPA_BUCHO_MEDIA}/cogumelos-ovo.webp`, alt: 'Cogumelos grelhados com ovo escalfado numa tigela' },
      { src: `${TAPA_BUCHO_MEDIA}/churros-sobremesa.webp`, alt: 'Churros polvilhados com açúcar, a serem mergulhados em creme de doce e chocolate' },
      { src: `${TAPA_BUCHO_MEDIA}/vinho-cerveja-petiscos.webp`, alt: 'Brinde com vinho tinto e cerveja Estrella Damm, com pão e azeitonas à mesa' },
    ],
    client: 'Tapa Bucho Gastrobar · Bairro Alto, Lisboa',
    duration: '',
    services: ['Website institucional', 'Menu online', 'Reservas e contacto direto', 'SEO local'],
    stack: [],
    showStack: false,
    challenge: [
      'Nascido em 2012 e reinventado em 2018 como gastrobar, o Tapa Bucho junta a tradição do petisco português a uma cozinha mais criativa, num ambiente vibrante e pensado para a partilha. Mas num bairro tão concorrido como o Bairro Alto, é o site que decide se alguém entra ou segue para a porta ao lado.',
      'Sem uma presença online à altura da experiência, o restaurante ficava dependente de quem passava à porta e do passa-palavra, perdendo quem pesquisa online antes de escolher onde jantar.',
    ],
    solution: [
      'Construímos um website onde os próprios petiscos são o argumento de venda: fotografias reais dos pratos, o menu sempre à mão e o contacto para reservar em destaque, sem distrações.',
      'A esplanada, o ambiente e a morada no coração do Bairro Alto ficaram em destaque, com otimização para pesquisa local — para aparecer a quem procura um gastrobar para petiscar e partilhar em Lisboa.',
    ],
    features: [
      'Menu com os petiscos e pratos de assinatura da casa',
      'Reserva e contacto direto em destaque',
      'Galeria de fotografias reais dos pratos e do espaço',
      'Morada, horário e indicações de como chegar',
      'Pensado primeiro para telemóvel',
    ],
    results: [],
    roi: '',
  },
  {
    slug: 'maison-glow',
    published: true,
    websiteUrl: 'https://v0-maison-glow-prototype.vercel.app/',
    title: 'Maison Glow',
    tag: 'Estética & Massoterapia',
    summary: 'Site de marcações para um espaço de estética e massoterapia, a apresentar os tratamentos de Vivian Rodrigues e a converter visitas em agendamentos por WhatsApp.',
    cover: { src: unsplash('1570172619644-dfd03ed5d881'), alt: 'Tratamento facial de estética, mãos a aplicar produto no rosto' },
    gallery: [
      { src: unsplash('1600334129128-685c5582fd35', 800), alt: 'Massagem com pedras vulcânicas quentes nas costas' },
      { src: unsplash('1515377905703-c4788e51af15', 800), alt: 'Esfoliação corporal com produtos naturais' },
      { src: unsplash('1544161515-4ab6ce6db874', 800), alt: 'Massagem relaxante, técnica suave nas costas' },
      { src: unsplash('1519823551278-64ac92734fb1', 800), alt: 'Massagem terapêutica direcionada a uma zona de tensão' },
      { src: unsplash('1487412947147-5cebf100ffc2', 800), alt: 'Limpeza de pele facial' },
      { src: unsplash('1540555700478-4be289fbecef', 800), alt: 'Ambiente calmo e relaxante de um espaço de estética' },
      { src: unsplash('1507652313519-d4e9174996dd', 800), alt: 'Produtos naturais usados nos tratamentos' },
      { src: unsplash('1552693673-1bf958298935', 800), alt: 'Sala de massagem aconchegante, preparada para uma sessão' },
    ],
    client: 'Maison Glow · Vivian Rodrigues, Esteticista e Massoterapeuta',
    duration: '',
    services: ['Website institucional', 'Catálogo de tratamentos', 'Agendamento por WhatsApp', 'SEO local'],
    stack: [],
    showStack: false,
    challenge: [
      'A Vivian Rodrigues construiu a sua reputação de esteticista e massoterapeuta sobretudo através das redes sociais, mas quem descobre o trabalho dela por lá não tem um sítio central onde ver todos os tratamentos, perceber duração e preço, e marcar sem trocar várias mensagens.',
      'Sem um site próprio, cada novo pedido de marcação começava do zero — a explicar outra vez os mesmos tratamentos a quem já estava convencido a agendar.',
    ],
    solution: [
      'Criámos um site de apresentação centrado nos seis tratamentos da casa — Tratamento Facial Glow, Massagem de Pedras Quentes, Esfoliação Corporal, Massagem Relaxante, Massagem Terapêutica e Limpeza de Pele — cada um com duração e descrição claras.',
      'A marcação passou a ser um clique direto para o WhatsApp, com uma secção "Sobre" a apresentar a Vivian e as suas especialidades, e testemunhos reais de clientes a dar confiança a quem ainda não a conhece.',
    ],
    features: [
      'Catálogo dos 6 tratamentos, com duração e descrição',
      'Marcação direta por WhatsApp, sem formulários',
      'Secção "Sobre" com as especialidades da Vivian',
      'Testemunhos de clientes em destaque',
      'Ligações diretas ao Instagram e TikTok',
      'Pensado primeiro para telemóvel',
    ],
    results: [],
    roi: '',
  },
  {
    slug: 'gastroflow',
    published: true,
    websiteUrl: '',
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
    showStack: false,
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
    websiteUrl: '',
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
    showStack: false,
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
    websiteUrl: '',
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
    showStack: false,
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
    websiteUrl: '',
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
    showStack: false,
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
    websiteUrl: '',
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
    showStack: false,
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
    websiteUrl: '',
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
    showStack: false,
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

