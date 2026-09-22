import 'server-only'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'

/** Ações auditadas. Nomes estáveis: são filtrados na página de auditoria. */
export const AUDIT_ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'ACCESS_DENIED',
  'UPDATE_CONTENT',
  'CREATE_PROJECT',
  'UPDATE_PROJECT',
  'DELETE_PROJECT',
  'REORDER_PROJECT',
  'SEED_PROJECTS',
  'UPLOAD_MEDIA',
  'UPDATE_CONTACT_EMAIL',
  'GRANT_PERMISSION',
  'REPLY_REQUEST',
  'ADD_INTERNAL_NOTE',
  'UPDATE_REQUEST',
  'CREATE_CLIENT_PROJECT',
  'UPDATE_CLIENT_PROJECT',
  'DELETE_CLIENT_PROJECT',
  'SEND_BROADCAST',
  'EXPORT_REVENUE',
  'LOG_INTERACTION',
  'MARK_DEAL_WON',
  'MARK_DEAL_LOST',
  'SET_GOAL',
  'APPLY_DISCOUNT',
  'EXTEND_DUE_DATE',
  'CONVERT_TO_INSTALLMENTS',
  'MARK_INVOICE_PAID_EXTERNALLY',
  'CREATE_INVOICE',
  'CREATE_DISCOUNT_CODE',
  'ADD_LOYALTY_POINTS',
] as const
export type AuditAction = (typeof AUDIT_ACTIONS)[number]

/** Módulos/recursos afetados (campo target_resource). */
export const AUDIT_RESOURCES = ['sessao', 'seguranca', 'conteudo_landing', 'projetos_cases', 'media', 'definicoes', 'permissoes_cliente', 'pedidos', 'projetos_cliente', 'comunicacoes', 'negocio', 'financeiro'] as const
export type AuditResource = (typeof AUDIT_RESOURCES)[number]

export type AuditEntry = {
  /** Quem fez: id e email do administrador autenticado */
  admin: { id: string; email: string }
  action: AuditAction
  resource: AuditResource
  /** Objeto ou utilizador afetado */
  targetId?: string
  /** Payload: normalmente { before, after } ou o detalhe da permissão concedida */
  details?: Record<string, unknown>
}

async function requestIp(): Promise<string | null> {
  try {
    const h = await headers()
    return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null
  } catch {
    return null // fora de um pedido HTTP
  }
}

/**
 * Regista uma ação administrativa. Chamar SEMPRE depois de a ação ter sucesso.
 * Nunca lança: uma falha na auditoria não desfaz a ação já feita, mas fica em console.error
 * (visível nos logs da Vercel) para ser investigada.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) return

  try {
    const { error } = await createAdminClient()
      .from('audit_logs')
      .insert({
        admin_id: entry.admin.id,
        admin_email: entry.admin.email.toLowerCase(),
        action: entry.action,
        target_resource: entry.resource,
        target_id: entry.targetId ?? null,
        details: entry.details ?? {},
        ip_address: await requestIp(),
      })
    if (error) throw error
  } catch (error) {
    console.error(`[audit] FALHA ao registar ${entry.action} por ${entry.admin.email}:`, error)
  }
}
