/**
 * Whitelist dos Super Admins. É a MESMA lista da tabela `super_admins` (supabase/004_super_admins_audit.sql):
 * o banco impede que qualquer outro email tenha o papel 'admin'; o código repete a verificação nas ações críticas.
 * Para mudar quem é Super Admin: alterar aqui E na tabela (migration nova).
 */
export const SUPER_ADMIN_EMAILS = ['946393361bill@gmail.com', 'geral.billtech@gmail.com'] as const

export const isSuperAdminEmail = (email: string | null | undefined): boolean =>
  Boolean(email) && (SUPER_ADMIN_EMAILS as readonly string[]).includes(email!.trim().toLowerCase())
