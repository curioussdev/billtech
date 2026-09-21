import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/config'

/** Cliente com a sessão do utilizador (cookies). Torna a rota dinâmica — usar só em áreas autenticadas. */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Chamado a partir de um Server Component: o proxy já renova a sessão.
        }
      },
    },
  })
}

/** Cliente anónimo sem cookies: mantém as páginas públicas estáticas. Só lê dados com RLS público. */
export function createPublicClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

/** Cliente com service role: ignora RLS. Nunca importar em código de cliente. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY não definida')
  return createSupabaseClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
