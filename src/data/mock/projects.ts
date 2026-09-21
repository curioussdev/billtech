import type { ClientProject } from '@/types/project'

/** Data "de hoje" usada por todos os mocks, para resultados determinísticos (sem hidratação instável). */
export const MOCK_NOW = '2026-09-21T10:00:00.000Z'

/** DADOS DE DEMONSTRAÇÃO — clientes e valores fictícios. Substituir por Prisma/PostgreSQL. */
export const mockProjects: ClientProject[] = [
  { id: 'p01', client: 'Oficina Carvalho & Filhos', name: 'Agendamento e histórico de reparações', sector: 'oficinas', value: 6800, status: 'entregue', marginPct: 62, soldAt: '2026-03-04', deliveredAt: '2026-05-06' },
  { id: 'p02', client: 'Tasca do Mercado', name: 'Menu digital e fidelização', sector: 'restauracao', value: 4200, status: 'entregue', marginPct: 58, soldAt: '2026-03-18', deliveredAt: '2026-05-12' },
  { id: 'p03', client: 'Clínica Vida Plena', name: 'Dashboard financeiro e agendamentos', sector: 'clinicas', value: 9500, status: 'entregue', marginPct: 64, soldAt: '2026-04-02', deliveredAt: '2026-06-25' },
  { id: 'p04', client: 'AutoBairro Lda', name: 'Aviso automático por WhatsApp', sector: 'oficinas', value: 2900, status: 'entregue', marginPct: 71, soldAt: '2026-04-15', deliveredAt: '2026-05-20' },
  { id: 'p05', client: 'Moda Atlântico', name: 'Loja online com stock sincronizado', sector: 'comercio', value: 11200, status: 'entregue', marginPct: 55, soldAt: '2026-05-06', deliveredAt: '2026-07-31' },
  { id: 'p06', client: 'Casa do Petisco', name: 'Pedidos por QR Code', sector: 'restauracao', value: 3600, status: 'entregue', marginPct: 60, soldAt: '2026-05-21', deliveredAt: '2026-06-30' },
  { id: 'p07', client: 'FitZone Ginásios', name: 'App de reservas de aulas', sector: 'fitness', value: 12800, status: 'entregue', marginPct: 52, soldAt: '2026-06-03', deliveredAt: '2026-08-28' },
  { id: 'p08', client: 'Clínica Dental Sorriso', name: 'Marcações online e lembretes', sector: 'clinicas', value: 5400, status: 'entregue', marginPct: 66, soldAt: '2026-06-17', deliveredAt: '2026-08-05' },
  { id: 'p09', client: 'Imobiliária Costa Verde', name: 'CRM de imóveis e leads', sector: 'imobiliario', value: 8700, status: 'entregue', marginPct: 59, soldAt: '2026-07-01', deliveredAt: '2026-09-10' },
  { id: 'p10', client: 'Transportes Lusitânia', name: 'Controlo de armazém e expedição', sector: 'logistica', value: 15400, status: 'em_teste', marginPct: 48, soldAt: '2026-07-14' },
  { id: 'p11', client: 'Restaurante O Cais', name: 'Gestão de mesas e desperdício', sector: 'restauracao', value: 5100, status: 'em_teste', marginPct: 57, soldAt: '2026-07-29' },
  { id: 'p12', client: 'Oficina Rápida Norte', name: 'Ordens de serviço digitais', sector: 'oficinas', value: 4600, status: 'em_desenvolvimento', marginPct: 63, soldAt: '2026-08-12' },
  { id: 'p13', client: 'Centro Médico Aurora', name: 'Portal do paciente', sector: 'clinicas', value: 13900, status: 'em_desenvolvimento', marginPct: 50, soldAt: '2026-08-25' },
  { id: 'p14', client: 'Loja Ponto Verde', name: 'CRM e faturação digital', sector: 'comercio', value: 6200, status: 'em_desenvolvimento', marginPct: 61, soldAt: '2026-09-04' },
  { id: 'p15', client: 'Padaria Real', name: 'Encomendas e fidelização', sector: 'restauracao', value: 3300, status: 'em_desenvolvimento', marginPct: 68, soldAt: '2026-09-15' },
]
