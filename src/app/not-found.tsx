import type { Metadata } from 'next'
import { Compass, Home, Mail } from 'lucide-react'
import { ErrorScene } from '@/components/error-scene'

export const metadata: Metadata = { title: 'Página não encontrada', robots: { index: false } }

export default function NotFound() {
  return (
    <ErrorScene
      code="404"
      icon={<Compass aria-hidden />}
      title="Esta página saiu de férias"
      description="O link pode estar errado, ou a página pode ter mudado de sítio. Vamos levá-lo de volta ao caminho certo."
      primary={{ label: 'Voltar ao início', href: '/', icon: <Home data-icon="inline-start" aria-hidden /> }}
      secondary={{ label: 'Falar connosco', href: '/#contato', icon: <Mail data-icon="inline-start" aria-hidden /> }}
    />
  )
}
