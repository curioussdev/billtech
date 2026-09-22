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

export const PROJECT_EVENT_KINDS = ['status', 'progress', 'due_date', 'nota', 'faturacao'] as const
export type ProjectEventKind = (typeof PROJECT_EVENT_KINDS)[number]

export interface ProjectEvent {
  id: string
  project_id: string
  kind: ProjectEventKind
  message: string
  created_at: string
  created_by: string | null
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
  /** 1–5, só preenchido depois de "concluído" — o cliente só pode avaliar uma vez. */
  satisfaction_rating: number | null
  satisfaction_comment: string
  satisfaction_at: string | null
}

export interface ProjectDocument {
  id: string
  project_id: string
  storage_path: string
  file_name: string
  content_type: string
  size_bytes: number
  created_at: string
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

export interface RequestAttachment {
  id: string
  request_id: string
  /** Nulo só na teoria (a tabela permite); na prática todo o anexo acompanha uma resposta concreta. */
  message_id: string | null
  storage_path: string
  file_name: string
  content_type: string
  size_bytes: number
  uploader_role: 'client' | 'admin'
  created_at: string
}

export interface Broadcast {
  id: string
  admin_email: string
  subject: string
  body: string
  audience: 'all' | 'selected'
  recipient_count: number
  email_requested: boolean
  created_at: string
}

export type EmailStatus = 'sent' | 'failed' | 'skipped'
