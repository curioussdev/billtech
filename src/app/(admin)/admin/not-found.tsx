import type { Metadata } from 'next'
import { FileQuestion, LayoutDashboard } from 'lucide-react'
import { ErrorScene } from '@/components/error-scene'

export const metadata: Metadata = { title: 'Não encontrado' }

export default function AdminNotFound() {
  return (
    <ErrorScene
      compact
      code="404"
      icon={<FileQuestion aria-hidden />}
      title="Não encontrámos isto"
      description="O registo pode ter sido apagado, ou o link está errado. Volte ao painel para continuar."
      primary={{ label: 'Ir para o Dashboard', href: '/admin', icon: <LayoutDashboard data-icon="inline-start" aria-hidden /> }}
    />
  )
}
