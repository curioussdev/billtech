import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Code2 } from 'lucide-react'
import { AuthForms } from '@/components/auth/auth-forms'
import { getCurrentProfile } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export const metadata: Metadata = { title: 'Entrar', robots: { index: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams
  const profile = await getCurrentProfile()
  if (profile) redirect(profile.role === 'admin' ? '/admin' : '/area-cliente')

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Voltar ao site
        </Link>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Code2 aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Área BillTech</h1>
              <p className="text-sm text-muted-foreground">Clientes e administração</p>
            </div>
          </div>

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
        </div>
      </div>
    </main>
  )
}
