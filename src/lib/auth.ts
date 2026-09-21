import 'server-only'
import { redirect } from 'next/navigation'
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
