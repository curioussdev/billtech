import type { Metadata } from 'next'
import { ProspectingWorkspace } from '@/components/admin/business/prospecting-workspace'
import { DemoBanner } from '@/components/admin/dashboard/demo-banner'
import { businessNow, listLeads, listMeetings } from '@/lib/admin/analytics'

export const metadata: Metadata = { title: 'Prospecção de Clientes' }

export default async function ProspectingPage() {
  const [leads, meetings] = await Promise.all([listLeads(), listMeetings()])

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Prospecção de Clientes</h1>
        <p className="mt-1 text-muted-foreground">Leads frios e mornos, canais de aquisição e reuniões da semana.</p>
      </div>
      <DemoBanner trafficIsLive={false} />
      <ProspectingWorkspace initialLeads={leads} initialMeetings={meetings} nowIso={businessNow().toISOString()} />
    </div>
  )
}
