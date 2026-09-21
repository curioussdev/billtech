import 'server-only'
import { redirect } from 'next/navigation'
import { logAudit } from '@/lib/audit'
import { isSuperAdminEmail } from '@/lib/super-admins'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

export type Profile = { id: string; email: string; full_name: string; company: string; role: 'client' | 'admin' }

/** Utilizador autenticado + perfil, ou null. Valida o JWT no servidor (getUser). */
export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, company, role')
    .eq('id', userData.user.id)
    .single()
  return (profile as Profile | null) ?? null
}

export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/entrar')
  return profile
}

/** Reforço de autorização: nunca confiar apenas no proxy. Usar em layouts E em cada Server Action. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireUser()
  if (profile.role !== 'admin') redirect('/area-cliente')
  return profile
}

// ─── Super Admin (autonomia restrita) ───────────────────────────────────────

export const FORBIDDEN_MESSAGE = '403 Forbidden — esta ação é reservada aos Super Admins autorizados.'

/**
 * Autonomia de nível Super Admin: papel ADMIN **e** email na whitelist restrita.
 * Bloqueia qualquer outro utilizador, mesmo que (por erro) tenha o papel admin.
 */
export function verifySuperAdminAutonomy(profile: Pick<Profile, 'role' | 'email'> | null | undefined): boolean {
  return profile?.role === 'admin' && isSuperAdminEmail(profile.email)
}

/** Para páginas: 403 (via componente) em vez de redirecionar; devolve o perfil se autorizado. */
export async function getSuperAdminOrNull(): Promise<Profile | null> {
  const profile = await requireAdmin()
  return verifySuperAdminAutonomy(profile) ? profile : null
}

/**
 * Para Server Actions críticas. Devolve o perfil autorizado, ou `null` (e regista a tentativa
 * negada na auditoria). Quem chama responde com FORBIDDEN_MESSAGE — o equivalente a um 403.
 */
export async function requireSuperAdminForAction(attempted: { action: string; resource: string }): Promise<Profile | null> {
  const profile = await requireAdmin()
  if (verifySuperAdminAutonomy(profile)) return profile
  await logAudit({ admin: profile, action: 'ACCESS_DENIED', resource: 'seguranca', details: { attempted } })
  return null
}
