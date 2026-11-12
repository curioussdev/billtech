import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthForms } from '@/components/auth/auth-forms'
import { AuthShell } from '@/components/auth/auth-shell'
import { getCurrentProfile } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export const metadata: Metadata = { title: 'Entrar', robots: { index: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams
  const profile = await getCurrentProfile()
  if (profile) redirect(profile.role === 'admin' ? '/admin' : '/area-cliente')

  return (
    <AuthShell title="Área BillTech" subtitle="Clientes e administração" backLink>
      {erro === 'confirmacao' && (
        <p role="alert" className="mb-6 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
          O link de confirmação é inválido ou expirou. Entre com o seu email ou crie a conta novamente.
        </p>
      )}

      {isSupabaseConfigured ? (
        <AuthForms />
      ) : (
        <p role="alert" className="rounded-lg bg-muted p-4 text-sm">
          A autenticação ainda não está configurada. Defina as variáveis <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (ver <code>.env.example</code>).
        </p>
      )}
    </AuthShell>
  )
}
