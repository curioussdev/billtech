import type { ProjectStage, RequestPriority, RequestStatus, RequestType } from '@/types/portal'

export const requestTypeLabels: Record<RequestType, string> = {
  alteracao: 'Alteração num projeto',
  implementacao: 'Nova implementação',
  suporte: 'Suporte / problema',
  orcamento: 'Pedido de orçamento',
  duvida: 'Dúvida',
}

export const requestTypeHints: Record<RequestType, string> = {
  alteracao: 'Mudar, corrigir ou melhorar algo que já existe.',
  implementacao: 'Uma funcionalidade, integração ou automação nova.',
  suporte: 'Algo não está a funcionar como esperado.',
  orcamento: 'Quer saber o custo e o prazo de algo novo.',
  duvida: 'Uma pergunta sobre o seu projeto ou a plataforma.',
}

export const priorityLabels: Record<RequestPriority, string> = { baixa: 'Baixa', normal: 'Normal', alta: 'Alta', urgente: 'Urgente' }

export const requestStatusLabels: Record<RequestStatus, string> = {
  aberto: 'Recebido',
  em_analise: 'Em análise',
  em_curso: 'Em curso',
  aguarda_cliente: 'Aguarda a sua resposta',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export const projectStageLabels: Record<ProjectStage, string> = {
  planeamento: 'Planeamento',
  desenvolvimento: 'Em desenvolvimento',
  testes: 'Em testes',
  entregue: 'Entregue',
  manutencao: 'Em manutenção',
}

/** Estados que ainda pedem ação da equipa ou do cliente. */
export const OPEN_STATUSES: RequestStatus[] = ['aberto', 'em_analise', 'em_curso', 'aguarda_cliente']

export const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })
export const formatDateTime = (iso: string) => new Date(iso).toLocaleString('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
