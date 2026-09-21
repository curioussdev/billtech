import type { Metadata } from 'next'
import { ComingSoon } from '@/components/admin/layout/coming-soon'

export const metadata: Metadata = { title: 'Logs de Acesso' }

export default function Page() {
  return <ComingSoon title="Logs de Acesso" description="Registo de inícios de sessão e ações administrativas." note="Ainda não há registo de acessos. Será ligado aos eventos de autenticação do Supabase." />
}
