import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Eye, ExternalLink as ExternalLinkIcon } from 'lucide-react'
import { RegenerateKeyButton } from '@/components/admin/command-center/regenerate-key-button'
import { TelemetryChart } from '@/components/admin/command-center/telemetry-chart'
import { ChartCard } from '@/components/admin/dashboard/chart-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getExternalSite, getTelemetrySummary } from '@/lib/command-center/queries'

export const metadata: Metadata = { title: 'Site externo' }

const statusStyles = { ativo: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300', inativo: 'bg-muted text-muted-foreground' }
const statusLabels = { ativo: 'Ativo', inativo: 'Inativo' }

function timeSince(iso: string | null): string {
  if (!iso) return 'Nunca'
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'Agora mesmo'
  if (minutes < 60) return `Há ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Há ${hours} h`
  return `Há ${Math.round(hours / 24)} dias`
}

const SNIPPET = `// No vosso servidor (NUNCA no browser) — ex.: uma rota de API do vosso site
import crypto from 'crypto'

const API_KEY = process.env.BILLTECH_API_KEY // a chave que vos demos

async function sendTelemetry(metricType, value) {
  const body = JSON.stringify({ metricType, value, occurredAt: new Date().toISOString() })
  const signature = crypto.createHmac('sha256', API_KEY).update(body).digest('hex')

  await fetch('https://billtech.online/api/v1/telemetry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-billtech-api-key': API_KEY,
      'x-billtech-signature': signature,
    },
    body,
  })
}

// Exemplos
sendTelemetry('page_view', { path: '/produtos' })
sendTelemetry('error', { message: 'Falha ao processar pagamento' })
sendTelemetry('uptime', { status: 'ok' })`

export default async function ExternalSiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const site = await getExternalSite(id)
  if (!site) notFound()

  const summary = await getTelemetrySummary(id)
  const online = site.lastPingAt ? Date.now() - new Date(site.lastPingAt).getTime() < 10 * 60_000 : false

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <Button render={<Link href="/admin/command-center" />} nativeButton={false} variant="ghost" size="sm" className="mb-1 -ml-2 w-fit">
        <ArrowLeft className="size-4" aria-hidden /> Voltar ao Centro de Comando
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
            {site.name}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[site.status]}`}>{statusLabels[site.status]}</span>
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
            <Link href={`/admin/clientes/${site.clientId}`} className="underline underline-offset-2">
              {site.clientName}
            </Link>{' '}
            ·{' '}
            <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">
              {site.domain} <ExternalLinkIcon className="size-3" aria-hidden />
            </a>
          </p>
        </div>
        <RegenerateKeyButton siteId={site.id} />
      </div>

      <section aria-label="Estado" className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="grid gap-1 p-5">
            <p className="text-sm font-medium text-muted-foreground">Último sinal</p>
            <p className="flex items-center gap-2 text-2xl font-black">
              <span className={`inline-block size-2.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} aria-hidden />
              {timeSince(site.lastPingAt)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="grid gap-1 p-5">
            <p className="text-sm font-medium text-muted-foreground">Visitas (30 dias)</p>
            <p className="text-2xl font-black tabular-nums">{summary.totalPageViews}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="grid gap-1 p-5">
            <p className="text-sm font-medium text-muted-foreground">Erros (30 dias)</p>
            <p className={`text-2xl font-black tabular-nums ${summary.totalErrors > 0 ? 'text-destructive' : ''}`}>{summary.totalErrors}</p>
          </CardContent>
        </Card>
      </section>

      <ChartCard title="Visitas e erros" description="Últimos 30 dias, por dia." delay={0}>
        <TelemetryChart data={summary.days} />
      </ChartCard>

      <section aria-labelledby="erros-recentes" className="grid gap-3">
        <h2 id="erros-recentes" className="text-xl font-bold">
          Erros recentes
        </h2>
        {summary.recentErrors.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">Sem erros registados.</p>
        ) : (
          <ul className="grid gap-2">
            {summary.recentErrors.map((e) => (
              <li key={e.id} className="rounded-xl border border-border bg-card p-3 text-sm">
                <p className="font-medium text-destructive">{e.message}</p>
                <p className="text-xs text-muted-foreground">{new Date(e.occurredAt).toLocaleString('pt-PT', { timeZone: 'UTC' })}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="integracao" className="grid gap-3">
        <h2 id="integracao" className="flex items-center gap-2 text-xl font-bold">
          <Eye className="size-5" aria-hidden /> Como integrar
        </h2>
        <p className="text-sm text-muted-foreground">Coloque a chave nas variáveis de ambiente do servidor do site (nunca no código do browser) e envie eventos assim:</p>
        <pre className="overflow-x-auto rounded-2xl border border-border bg-muted/40 p-4 text-xs leading-6">
          <code>{SNIPPET}</code>
        </pre>
      </section>
    </div>
  )
}
