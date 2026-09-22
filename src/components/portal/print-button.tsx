'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrintButton() {
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => window.print()} className="rounded-full">
      <Printer aria-hidden /> Imprimir / Guardar em PDF
    </Button>
  )
}
