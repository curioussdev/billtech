import type { Metadata } from 'next'
import { ComingSoon } from '@/components/admin/layout/coming-soon'

export const metadata: Metadata = { title: 'Relatórios' }

export default function Page() {
  return <ComingSoon title="Relatórios" description="Resumos semanais, mensais e anuais com comparativos e previsão." />
}
