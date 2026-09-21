import { MOCK_NOW } from '@/data/mock/projects'
import type { Lead, LeadChannel, LeadStage, Meeting } from '@/types/lead'
import type { Sector } from '@/types/project'

/** DADOS DE DEMONSTRAÇÃO — empresas e valores fictícios. Substituir por Prisma/PostgreSQL. */

const DAY = 86_400_000
/** Data ISO N dias antes da data de referência dos mocks. */
const ago = (days: number, hour = 10) => new Date(new Date(MOCK_NOW).getTime() - days * DAY + (hour - 10) * 3_600_000).toISOString()
const ahead = (days: number, hour: number, minute = 0) => {
  const d = new Date(new Date(MOCK_NOW).getTime() + days * DAY)
  d.setUTCHours(hour, minute, 0, 0)
  return d.toISOString()
}

type Seed = [id: string, contact: string, company: string, sector: Sector, value: number, stage: LeadStage, channel: LeadChannel, createdDaysAgo: number, inStageDays: number, followUps: number, respHours: number | null]

const seeds: Seed[] = [
  // Lead captado
  ['l01', 'Rui Baptista', 'Oficina Central do Porto', 'oficinas', 5200, 'captado', 'organico', 3, 3, 0, null],
  ['l02', 'Marta Leal', 'Restaurante Alecrim', 'restauracao', 3800, 'captado', 'whatsapp', 2, 2, 0, 1.5],
  ['l03', 'Hugo Serrão', 'Clínica Dental Bela Vista', 'clinicas', 7400, 'captado', 'linkedin', 4, 4, 1, 6],
  ['l04', 'Sónia Pires', 'Boutique Maré Alta', 'comercio', 4500, 'captado', 'organico', 1, 1, 0, null],
  ['l05', 'Nuno Alves', 'Ginásio Força Total', 'fitness', 9800, 'captado', 'indicacao', 5, 5, 1, 2],
  ['l06', 'Inês Rocha', 'Padaria Sol Nascente', 'restauracao', 2600, 'captado', 'whatsapp', 6, 6, 0, 18],
  // Qualificado
  ['l07', 'Paulo Nogueira', 'AutoPeças Nogueira', 'oficinas', 6100, 'qualificado', 'indicacao', 12, 5, 2, 1],
  ['l08', 'Cátia Mendes', 'Clínica Sorrir+', 'clinicas', 11200, 'qualificado', 'linkedin', 15, 6, 2, 3],
  ['l09', 'Diogo Faria', 'Imobiliária Atlântico', 'imobiliario', 9600, 'qualificado', 'organico', 10, 4, 1, 4],
  ['l10', 'Bruno Cunha', 'Frota Express', 'logistica', 14500, 'qualificado', 'linkedin', 18, 8, 3, 2],
  ['l11', 'Lúcia Torres', 'Café Central Braga', 'restauracao', 3400, 'qualificado', 'whatsapp', 9, 3, 1, 1],
  // Proposta enviada
  ['l12', 'Fernando Moura', 'Oficina Moura & Irmão', 'oficinas', 7800, 'proposta', 'indicacao', 22, 6, 3, 1],
  ['l13', 'Vera Campos', 'Centro Fisio Vida', 'clinicas', 12400, 'proposta', 'organico', 25, 9, 4, 2],
  ['l14', 'Tiago Ramos', 'Loja Verde Urbano', 'comercio', 8900, 'proposta', 'linkedin', 20, 4, 2, 5],
  ['l15', 'Alda Sousa', 'Ginásio Movimento', 'fitness', 10800, 'proposta', 'whatsapp', 28, 12, 4, 1],
  // Em negociação
  ['l16', 'Rita Gomes', 'Logística Rápida Sul', 'logistica', 18500, 'negociacao', 'linkedin', 35, 7, 5, 2],
  ['l17', 'André Matos', 'Grupo Sabor & Arte', 'restauracao', 8200, 'negociacao', 'indicacao', 30, 5, 4, 1],
  ['l18', 'Sofia Lima', 'Imobiliária Horizonte', 'imobiliario', 13200, 'negociacao', 'organico', 33, 10, 5, 3],
  // Ganho
  ['l19', 'Joana Freitas', 'Oficina Rápida Norte', 'oficinas', 4600, 'ganho', 'indicacao', 50, 40, 3, 1],
  ['l20', 'Carlos Pinto', 'Centro Médico Aurora', 'clinicas', 13900, 'ganho', 'linkedin', 60, 27, 5, 2],
  ['l21', 'Pedro Nunes', 'Loja Ponto Verde', 'comercio', 6200, 'ganho', 'organico', 40, 17, 3, 4],
  ['l22', 'Helena Costa', 'Padaria Real', 'restauracao', 3300, 'ganho', 'whatsapp', 32, 6, 2, 1],
  ['l23', 'Miguel Santos', 'Imobiliária Costa Verde', 'imobiliario', 8700, 'ganho', 'indicacao', 75, 82, 4, 2],
  // Perdido
  ['l24', 'Rosa Andrade', 'Snack-Bar Girassol', 'restauracao', 2100, 'perdido', 'whatsapp', 45, 20, 2, 26],
  ['l25', 'Jorge Teixeira', 'Auto Serviço Teixeira', 'oficinas', 5400, 'perdido', 'organico', 55, 30, 3, 8],
  ['l26', 'Elisa Batista', 'Centro de Estética Lume', 'comercio', 6800, 'perdido', 'linkedin', 62, 25, 4, 5],
]

export const mockLeads: Lead[] = seeds.map(([id, contactName, company, sector, estimatedValue, stage, channel, created, inStage, followUps, firstResponseHours]) => ({
  id,
  contactName,
  company,
  sector,
  estimatedValue,
  stage,
  channel,
  createdAt: ago(created),
  stageEnteredAt: ago(inStage),
  owner: 'José Lopes',
  followUps,
  firstResponseHours,
}))

/** Reuniões da semana corrente (a data de referência é uma segunda-feira). */
export const mockMeetings: Meeting[] = [
  { id: 'm01', leadId: 'l16', title: 'Fecho de contrato — Logística Rápida Sul', start: ahead(0, 14, 0), durationMin: 60, kind: 'reuniao' },
  { id: 'm02', leadId: 'l12', title: 'Follow-up da proposta — Oficina Moura', start: ahead(1, 10, 30), durationMin: 30, kind: 'follow-up' },
  { id: 'm03', leadId: 'l08', title: 'Demo do painel — Clínica Sorrir+', start: ahead(1, 15, 0), durationMin: 45, kind: 'demo' },
  { id: 'm04', leadId: 'l10', title: 'Diagnóstico — Frota Express', start: ahead(2, 11, 0), durationMin: 60, kind: 'reuniao' },
  { id: 'm05', leadId: 'l13', title: 'Negociação de prazos — Centro Fisio Vida', start: ahead(3, 16, 0), durationMin: 30, kind: 'follow-up' },
  { id: 'm06', leadId: 'l03', title: 'Primeira conversa — Clínica Dental Bela Vista', start: ahead(4, 9, 30), durationMin: 30, kind: 'reuniao' },
]
