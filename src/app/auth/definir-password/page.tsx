import type { Metadata } from 'next'
import { Code2 } from 'lucide-react'
import { SetPasswordForm } from '@/components/auth/set-password-form'

export const metadata: Metadata = { title: 'Definir password', robots: { index: false } }

/**
 * Página única e dedicada para definir/alterar a password — nunca a landing page. Chega-se aqui
 * pelo link de convite, de recuperação ou do pedido de alteração nas definições. A sessão vem por
 * fragmento da URL (`#access_token=...`), que só o browser vê — por isso a verificação da sessão
 * é feita no cliente (`SetPasswordForm`), não aqui no servidor.
 */
export default function SetPasswordPage() {
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

          <SetPasswordForm />
        </div>
      </div>
    </main>
  )
}
