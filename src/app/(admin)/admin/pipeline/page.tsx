import type { Metadata } from 'next'
import { ComingSoon } from '@/components/admin/layout/coming-soon'

export const metadata: Metadata = { title: 'Pipeline de Vendas' }

export default function Page() {
  return <ComingSoon title="Pipeline de Vendas" description="Funil B2B em Kanban, do lead captado ao negócio ganho ou perdido." />
}
