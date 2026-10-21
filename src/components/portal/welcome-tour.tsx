'use client'

import { useState } from 'react'
import { completeOnboarding } from '@/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const steps = [
  { title: 'Bem-vindo à área de cliente', body: 'Aqui acompanha os seus projetos, pedidos e faturas com a BillTech — tudo num só lugar.' },
  { title: 'Visão geral', body: 'O painel inicial resume o que precisa de atenção: pedidos por ler, faturas em aberto e os seus projetos mais recentes.' },
  { title: 'Novo pedido', body: 'Precisa de uma alteração, suporte ou tem uma dúvida? Use "Novo pedido", no topo, a qualquer momento.' },
  { title: 'Faturas', body: 'Veja o estado de cada fatura e, se estiver parcelada, acompanhe quanto já pagou e quanto falta.' },
  { title: 'A minha conta', body: 'Nas definições pode atualizar os seus dados e pedir a alteração de password sempre que precisar.' },
]

/** Tour de 5 passos no primeiro acesso — só é montado quando `show` vem true do servidor (perfil sem onboarding_completed_at). */
export function WelcomeTour({ show }: { show: boolean }) {
  const [open, setOpen] = useState(show)
  const [step, setStep] = useState(0)

  if (!show) return null

  async function finish() {
    setOpen(false)
    await completeOnboarding()
  }

  const current = steps[step]
  const last = step === steps.length - 1

  return (
    <Dialog open={open} onOpenChange={(v) => !v && finish()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.body}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-1.5 py-2">
          {steps.map((_, i) => (
            <span key={i} className={`size-1.5 rounded-full ${i === step ? 'bg-primary' : 'bg-muted'}`} aria-hidden />
          ))}
          <span className="sr-only">
            Passo {step + 1} de {steps.length}
          </span>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={finish}>
            Saltar tour
          </Button>
          <Button type="button" onClick={() => (last ? finish() : setStep((s) => s + 1))}>
            {last ? 'Concluir' : 'Seguinte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
