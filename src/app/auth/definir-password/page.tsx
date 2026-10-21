import type { Metadata } from 'next'
import { Code2 } from 'lucide-react'
import { SetPasswordForm } from '@/components/auth/set-password-form'

export const metadata: Metadata = { title: 'Definir password', robots: { index: false } }

type Search = { token_hash?: string; type?: string }

/**
 * Página única e dedicada para definir/alterar a password — nunca a landing page. Chega-se aqui
 * pelo link de convite, de recuperação ou do pedido de alteração nas definições, sempre com
 * `?token_hash=…&type=…` (nunca o `action_link` direto da Supabase — ver nota em
 * `src/actions/clients.ts`). A verificação em si (`verifyOtp`) só acontece no cliente, porque só aí
 * sabemos que foi mesmo a pessoa a abrir a página, não um scanner de segurança do email.
 */
export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { token_hash: tokenHash, type } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Code2 aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Definir password</h1>
              <p className="text-sm text-muted-foreground">BillTech</p>
            </div>
          </div>

          <SetPasswordForm tokenHash={tokenHash} type={type === 'invite' ? 'invite' : 'recovery'} />
        </div>
      </div>
    </main>
  )
}
