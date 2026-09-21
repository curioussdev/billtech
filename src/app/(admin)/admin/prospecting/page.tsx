import type { Metadata } from 'next'
import { ComingSoon } from '@/components/admin/layout/coming-soon'

export const metadata: Metadata = { title: 'Prospecção de Clientes' }

export default function Page() {
  return <ComingSoon title="Prospecção de Clientes" description="Leads frios e mornos, canais de aquisição e reuniões da semana." />
}
