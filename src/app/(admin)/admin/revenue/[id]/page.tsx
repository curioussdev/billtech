import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { updateDealDelivery } from '@/actions/pipeline'
import { BusinessStatusBadge } from '@/components/admin/business/widgets'
import { SetPaymentPlanForm } from '@/components/admin/revenue/set-payment-plan-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { listProjects } from '@/lib/admin/analytics'
import { formatEUR } from '@/lib/admin/format'
import { paymentTypeLabels } from '@/lib/finance/labels'
import { PROJECT_STATUSES, type ProjectStatus } from '@/types/project'

export const metadata: Metadata = { title: 'Entrega do projeto' }

const statusOptionLabels: Record<ProjectStatus, string> = {
  em_desenvolvimento: 'Em desenvolvimento',
  em_teste: 'Em teste',
  entregue: 'Entregue',
}

const selectClass =
  'h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-none'

export default async function EditDealDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = (await listProjects()).find((p) => p.id === id)
  if (!project) notFound()

  return (
    <div className="mx-auto max-w-xl">
      <Button render={<Link href="/admin/revenue" />} nativeButton={false} variant="ghost" size="sm" className="mb-4 -ml-2">
        <ArrowLeft className="size-4" aria-hidden /> Voltar a Receita &amp; Projetos
      </Button>

      <h1 className="text-3xl font-black tracking-tight">{project.name}</h1>
      <p className="mt-1 text-muted-foreground">
        {project.client} · {formatEUR(project.value)}
      </p>

      <Card className="mt-6">
        <CardContent className="grid gap-5 p-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Estado atual:</span>
            <BusinessStatusBadge status={project.status} />
          </div>

          <div className="grid gap-1 rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <p className="font-semibold">Pagamento</p>
            {project.paymentType ? (
              <>
                <p className="text-muted-foreground">
                  {paymentTypeLabels[project.paymentType]}
                  {project.paymentType === 'parcelado' && project.paymentInstallments ? ` em ${project.paymentInstallments}x` : ''}
                </p>
                {project.invoiceId ? (
                  <Button render={<Link href={`/admin/finance${project.clientId ? `?cliente=${project.clientId}` : ''}`} />} nativeButton={false} variant="outline" size="sm" className="mt-1 w-fit rounded-lg">
                    Ver fatura no financeiro
                  </Button>
                ) : (
                  <p className="text-xs text-amber-700 dark:text-amber-400">Ainda sem fatura — associe este negócio a uma conta de cliente no Pipeline para a gerar automaticamente.</p>
                )}
              </>
            ) : project.clientId ? (
              <SetPaymentPlanForm leadId={project.id} />
            ) : (
              <p className="text-xs text-amber-700 dark:text-amber-400">Associe este negócio a uma conta de cliente no Pipeline para poder definir a forma de pagamento.</p>
            )}
          </div>

          <form action={updateDealDelivery} className="grid gap-4">
            <input type="hidden" name="leadId" value={project.id} />

            <div className="grid gap-1.5">
              <Label htmlFor="deliveryStatus">Estado da entrega</Label>
              <select id="deliveryStatus" name="deliveryStatus" defaultValue={project.status} className={selectClass}>
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusOptionLabels[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="marginPct">Margem (%)</Label>
              <Input id="marginPct" name="marginPct" type="number" min={0} max={100} step="0.1" defaultValue={project.marginPct} required />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="deliveredAt">Data de entrega</Label>
              <Input id="deliveredAt" name="deliveredAt" type="date" defaultValue={project.deliveredAt?.slice(0, 10) ?? ''} />
              <p className="text-xs text-muted-foreground">Só é gravada quando o estado é &quot;Entregue&quot;. Se ficar em branco, usa a data de hoje.</p>
            </div>

            <Button type="submit" className="justify-self-start">
              Guardar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
