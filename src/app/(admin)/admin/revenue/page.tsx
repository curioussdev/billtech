import type { Metadata } from 'next'
import { ComingSoon } from '@/components/admin/layout/coming-soon'

export const metadata: Metadata = { title: 'Receita & Projetos' }

export default function Page() {
  return <ComingSoon title="Receita & Projetos" description="Projetos vendidos, receita, margem e filtros por período, setor e estado." />
}
