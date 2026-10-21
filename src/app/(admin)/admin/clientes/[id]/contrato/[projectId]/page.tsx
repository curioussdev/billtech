import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { ContractGenerator } from '@/components/admin/contratos/contract-generator'
import { Button } from '@/components/ui/button'
import { requireAdmin } from '@/lib/auth'
import { getMostRecentInvoiceForClient } from '@/lib/finance/admin-queries'
import { createAdminClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Gerar contrato' }

export default async function GenerateContractPage({ params }: { params: Promise<{ id: string; projectId: string }> }) {
  const { id, projectId } = await params
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(projectId).success) notFound()
  await requireAdmin()

  const db = createAdminClient()
  const [{ data: project }, { data: client }, { data: contract }, invoice] = await Promise.all([
    db.from('client_projects').select('*').eq('id', projectId).eq('client_id', id).maybeSingle(),
    db.from('profiles').select('full_name, company, email, nif').eq('id', id).maybeSingle(),
    db.from('contracts').select('*').eq('project_id', projectId).maybeSingle(),
    getMostRecentInvoiceForClient(id),
  ])
  if (!project || !client) notFound()

  const initial = {
    clientName: client.full_name || client.email,
    clientCompany: client.company || '',
    clientNif: client.nif,
    projectName: project.name,
    scope: contract?.scope ?? project.description ?? '',
    totalAmount: contract?.total_amount ?? invoice?.finalAmount ?? 0,
    paymentType: contract?.payment_type ?? invoice?.paymentType ?? ('unico' as const),
    installments: contract?.installments ?? (invoice?.paymentType === 'parcelado' ? invoice.installments.length : null),
    startDate: contract?.start_date ?? new Date().toISOString().slice(0, 10),
    dueDate: contract?.due_date ?? project.due_date ?? null,
    sentAt: contract?.sent_at ?? null,
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Button render={<Link href={`/admin/clientes/${id}`} />} nativeButton={false} variant="ghost" size="sm" className="mb-4 -ml-2 print:hidden">
        <ArrowLeft className="size-4" aria-hidden /> Voltar à ficha do cliente
      </Button>
      <h1 className="text-3xl font-black tracking-tight print:hidden">Gerar contrato — {project.name}</h1>
      <p className="mb-6 mt-2 text-muted-foreground print:hidden">
        Reveja e ajuste os dados antes de enviar — é um documento legal, nada aqui é aplicado sem a sua confirmação.
      </p>
      <ContractGenerator projectId={projectId} initial={initial} />
    </div>
  )
}
