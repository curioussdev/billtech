import type { Metadata } from 'next'
import { ProspectingWorkspace } from '@/components/admin/business/prospecting-workspace'
import { NewLeadModal } from '@/components/admin/crm/new-lead-modal'
import { businessNow, listLeads, listMeetings } from '@/lib/admin/analytics'

export const metadata: Metadata = { title: 'Prospecção de Clientes' }

export default async function ProspectingPage() {
  const [leads, meetings] = await Promise.all([listLeads(), listMeetings()])

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Prospecção de Clientes</h1>
          <p className="mt-1 text-muted-foreground">Leads frios e mornos, canais de aquisição e reuniões da semana.</p>
        </div>
        <NewLeadModal />
      </div>
      <p role="note" className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        As reuniões agendadas aqui ainda não ficam guardadas — ao atualizar a página voltam ao calendário de exemplo.
      </p>
      <ProspectingWorkspace initialLeads={leads} initialMeetings={meetings} nowIso={businessNow().toISOString()} />
    </div>
  )
}
