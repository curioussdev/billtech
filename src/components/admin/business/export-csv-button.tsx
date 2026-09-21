'use client'

import { useState, useTransition } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { exportRevenueCsv } from '@/actions/reports'
import { Button } from '@/components/ui/button'
import type { RevenueFilters, SortKey } from '@/lib/admin/business'

export function ExportCsvButton({ filters, ordem, dir }: { filters: RevenueFilters; ordem: SortKey; dir: 'asc' | 'desc' }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function download() {
    setMessage(null)
    startTransition(async () => {
      const result = await exportRevenueCsv({ ...filters, ordem, dir })
      if (!result.ok) return setMessage(result.message)

      const url = URL.createObjectURL(new Blob([result.csv], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = result.filename
      link.click()
      URL.revokeObjectURL(url)
      setMessage(`${result.rows} linhas exportadas.`)
    })
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="outline" onClick={download} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />} Exportar CSV
      </Button>
      <span role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {message}
      </span>
    </div>
  )
}
