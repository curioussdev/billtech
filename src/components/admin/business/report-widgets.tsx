'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ReportPeriod } from '@/lib/admin/reports'

const tabLabels: Record<ReportPeriod, string> = { semanal: 'Semanal', mensal: 'Mensal', anual: 'Anual' }

/** Abas dos três relatórios (conteúdo renderizado no servidor e passado como nós). */
export function ReportTabs({ reports }: { reports: Record<ReportPeriod, React.ReactNode> }) {
  return (
    <Tabs defaultValue="mensal" className="gap-6">
      <TabsList aria-label="Período do relatório" className="w-fit">
        {(Object.keys(reports) as ReportPeriod[]).map((p) => (
          <TabsTrigger key={p} value={p} className="px-5">
            {tabLabels[p]}
          </TabsTrigger>
        ))}
      </TabsList>
      {(Object.keys(reports) as ReportPeriod[]).map((p) => (
        <TabsContent key={p} value={p} className="text-base">
          {reports[p]}
        </TabsContent>
      ))}
    </Tabs>
  )
}

/** Chama o endpoint de PDF (ainda em preparação) e mostra a resposta. */
export function PdfButton({ period }: { period: ReportPeriod }) {
  const [state, setState] = useState<{ loading: boolean; message: string | null }>({ loading: false, message: null })

  async function generate() {
    setState({ loading: true, message: null })
    try {
      const response = await fetch(`/api/admin/reports/pdf?periodo=${period}`, { cache: 'no-store' })
      if (response.headers.get('content-type')?.includes('application/pdf')) {
        const url = URL.createObjectURL(await response.blob())
        const link = document.createElement('a')
        link.href = url
        link.download = `relatorio-${period}.pdf`
        link.click()
        URL.revokeObjectURL(url)
        return setState({ loading: false, message: 'PDF gerado.' })
      }
      const body = (await response.json()) as { message?: string; error?: string }
      setState({ loading: false, message: body.message ?? body.error ?? 'Não foi possível gerar o PDF.' })
    } catch {
      setState({ loading: false, message: 'Não foi possível contactar o servidor.' })
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" onClick={generate} disabled={state.loading}>
        {state.loading ? <Loader2 className="animate-spin" aria-hidden /> : <FileDown aria-hidden />} Gerar PDF
      </Button>
      <span role="status" aria-live="polite" className="max-w-md text-sm text-muted-foreground">
        {state.message}
      </span>
    </div>
  )
}
