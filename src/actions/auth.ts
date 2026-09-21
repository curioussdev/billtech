'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { siteUrl } from '@/data/site'
import { getCurrentProfile } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { createClient } from '@/lib/supabase/server'

export type AuthState = {
  status: 'idle' | 'error' | 'success'
  message?: string
  fieldErrors?: Record<string, string>
  values?: Record<string, string>
}

const read = (fd: FormData, key: string) => {
  const v = fd.get(key)
  return typeof v === 'string' ? v : ''
}

const notConfigured: AuthState = { status: 'error', message: 'A autenticação ainda não está configurada neste ambiente.' }

const loginSchema = z.object({
  email: z.email('Indique um email válido.'),
  password: z.string().min(1, 'Indique a palavra-passe.'),
})

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Indique o seu nome.').max(100),
  company: z.string().trim().max(120),
  email: z.email('Indique um email válido.'),
  password: z.string().min(8, 'A palavra-passe deve ter pelo menos 8 caracteres.').max(72),
})

function fieldErrorsOf(error: z.ZodError) {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(z.flattenError(error).fieldErrors)) out[k] = (v as string[])[0]
  return out
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return notConfigured

  const values = { email: read(formData, 'email') }
  const parsed = loginSchema.safeParse({ ...values, password: read(formData, 'password') })
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsOf(parsed.error), values }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  // Mensagem genérica: não revela se o email existe
  if (error) return { status: 'error', message: 'Email ou palavra-passe incorretos, ou email ainda por confirmar.', values }

  const profile = await getCurrentProfile()
  redirect(profile?.role === 'admin' ? '/admin' : '/area-cliente')
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return notConfigured

  const values = { fullName: read(formData, 'fullName'), company: read(formData, 'company'), email: read(formData, 'email') }
  const parsed = registerSchema.safeParse({ ...values, password: read(formData, 'password') })
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsOf(parsed.error), values }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName, company: parsed.data.company },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) return { status: 'error', message: 'Não foi possível criar a conta. Tente novamente ou use outro email.', values }
  if (data.session) redirect('/area-cliente')

  return { status: 'success', message: 'Conta criada! Enviámos um email de confirmação — abra-o para ativar o acesso.' }
}

export async function logout() {
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  redirect('/')
}
