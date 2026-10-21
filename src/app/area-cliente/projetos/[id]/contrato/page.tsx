import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { ArrowLeft, FileSignature } from 'lucide-react'
import { ContractDocument } from '@/components/contracts/contract-document'
import { PrintButton } from '@/components/portal/print-button'
import { Button } from '@/components/ui/button'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Contrato' }

export default async function ClientContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()
  const profile = await requireUser()

  const supabase = await createClient()
  const { data: contract } = await supabase.from('contracts').select('*').eq('project_id', id).maybeSingle()

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <Link href={`/area-cliente/projetos/${id}`} className="inline-flex w-fit items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground print:hidden">
        <ArrowLeft className="size-4" aria-hidden /> Voltar ao projeto
      </Link>

      {!contract ? (
        <p className="flex items-center gap-2 rounded-2xl border border-dashed border-border bg-card p-8 text-muted-foreground">
          <FileSignature className="size-5 shrink-0" aria-hidden /> Ainda não há nenhum contrato disponível para este projeto.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 print:hidden">
            <h1 className="text-2xl font-black tracking-tight">Contrato</h1>
            <PrintButton />
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 print:border-0 print:p-0">
            <ContractDocument
              data={{
                clientName: profile.full_name || profile.email,
                clientCompany: profile.company,
                clientNif: profile.nif,
                projectName: contract.project_name,
                scope: contract.scope,
                totalAmount: contract.total_amount,
                paymentType: contract.payment_type,
                installments: contract.installments,
                startDate: contract.start_date,
                dueDate: contract.due_date,
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
