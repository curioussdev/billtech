import type { Metadata } from 'next'
import { FileQuestion, LayoutDashboard } from 'lucide-react'
import { ErrorScene } from '@/components/error-scene'

export const metadata: Metadata = { title: 'Não encontrado' }

export default function PortalNotFound() {
  return (
    <ErrorScene
      compact
      code="404"
      icon={<FileQuestion aria-hidden />}
      title="Não encontrámos esta página"
      description="Pode ter sido movida, ou o link não está certo. Volte à sua área para continuar."
      primary={{ label: 'Ir para a Visão geral', href: '/area-cliente', icon: <LayoutDashboard data-icon="inline-start" aria-hidden /> }}
    />
  )
}
