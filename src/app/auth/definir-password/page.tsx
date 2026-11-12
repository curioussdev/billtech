import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/auth-shell'
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
    <AuthShell title="Definir password" subtitle="BillTech">
      <SetPasswordForm tokenHash={tokenHash} type={type === 'invite' ? 'invite' : 'recovery'} />
    </AuthShell>
  )
}
