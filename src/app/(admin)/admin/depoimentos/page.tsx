import type { Metadata } from 'next'
import { ComingSoon } from '@/components/admin/layout/coming-soon'

export const metadata: Metadata = { title: 'Depoimentos' }

export default function Page() {
  return <ComingSoon title="Depoimentos" description="Testemunhos de clientes para a landing page." note="A landing ainda não tem secção de depoimentos. Quando a criarmos, será editável aqui." />
}
