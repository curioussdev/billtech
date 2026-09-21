'use client'

import { useEffect, useMemo, useState } from 'react'
import Autoplay from 'embla-carousel-autoplay'
import { Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel'

const DELAY_MS = 4000

const controlClass = 'border-white/30 bg-transparent text-inverse-foreground hover:bg-white/10 hover:text-inverse-foreground'

/**
 * Carrossel que gira sozinho, em ciclo infinito e com transição lenta e suave.
 * - Pausa ao passar o rato, ao focar um cartão e quando o separador fica oculto.
 * - Botão de pausa/retoma (acessibilidade: movimento automático tem de poder parar).
 * - Não arranca se o utilizador prefere menos movimento.
 */
export function AutoCarousel({ slides, label }: { slides: React.ReactNode[]; label: string }) {
  const [api, setApi] = useState<CarouselApi>()
  const [playing, setPlaying] = useState(false)

  // O ciclo infinito precisa de mais slides do que os visíveis (3 no desktop): com poucos projetos,
  // repetimos a lista. As cópias ficam inertes para não duplicar foco nem leitura por leitores de ecrã.
  const cloned = slides.length > 0 && slides.length < 6
  const items = cloned ? [...slides, ...slides] : slides

  const autoplay = useMemo(() => Autoplay({ delay: DELAY_MS, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true, playOnInit: false }), [])

  useEffect(() => {
    if (!api) return
    const onPlay = () => setPlaying(true)
    const onStop = () => setPlaying(false)
    api.on('autoplay:play', onPlay).on('autoplay:stop', onStop)

    // Só arranca sozinho se o utilizador não pediu menos movimento
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) autoplay.play()

    // Poupa CPU: em segundo plano não gira
    const onVisibility = () => (document.hidden ? autoplay.stop() : !window.matchMedia('(prefers-reduced-motion: reduce)').matches && autoplay.play())
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      api.off('autoplay:play', onPlay).off('autoplay:stop', onStop)
    }
  }, [api, autoplay])

  return (
    <Carousel opts={{ align: 'start', loop: true, duration: 45 }} plugins={[autoplay]} setApi={setApi} className="mt-6" aria-label={label}>
      <CarouselContent className="-ml-5">
        {items.map((slide, index) => {
          const isClone = index >= slides.length
          return (
          // py-6: espaço para o movimento flutuante não ser cortado pelo overflow do carrossel
          <CarouselItem key={index} className="py-6 pl-5 md:basis-1/2 lg:basis-1/3" aria-label={`${(index % slides.length) + 1} de ${slides.length}`} {...(isClone ? { 'aria-hidden': true, inert: true } : {})}>
            {slide}
          </CarouselItem>
          )
        })}
      </CarouselContent>
      <div className="mt-3 flex items-center justify-center gap-2">
        <CarouselPrevious className={`static translate-y-0 ${controlClass}`} />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className={`rounded-full ${controlClass}`}
          onClick={() => (playing ? autoplay.stop() : autoplay.play())}
          aria-label={playing ? 'Pausar rotação automática' : 'Retomar rotação automática'}
        >
          {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
        </Button>
        <CarouselNext className={`static translate-y-0 ${controlClass}`} />
      </div>
    </Carousel>
  )
}
