export const REQUEST_TYPES = ['alteracao', 'implementacao', 'suporte', 'orcamento', 'duvida'] as const
export type RequestType = (typeof REQUEST_TYPES)[number]

export const REQUEST_PRIORITIES = ['baixa', 'normal', 'alta', 'urgente'] as const
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number]

export const REQUEST_STATUSES = ['aberto', 'em_analise', 'em_curso', 'aguarda_cliente', 'concluido', 'cancelado'] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export const PROJECT_STAGES = ['planeamento', 'desenvolvimento', 'testes', 'entregue', 'manutencao'] as const
export type ProjectStage = (typeof PROJECT_STAGES)[number]

export interface PortalProject {
  id: string
  client_id: string
  name: string
  description: string
  status: ProjectStage
  progress: number
  due_date: string | null
  url: string
  created_at: string
  updated_at: string
}

export interface PortalRequest {
  id: string
  client_id: string
  project_id: string | null
  type: RequestType
  title: string
  description: string
  priority: RequestPriority
  status: RequestStatus
  client_unread: boolean
  admin_unread: boolean
  created_at: string
  updated_at: string
  last_message_at: string
}

export interface RequestMessage {
  id: string
  request_id: string
  author_id: string | null
  author_role: 'client' | 'admin'
  body: string
  internal: boolean
  created_at: string
}
