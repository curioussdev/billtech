import 'server-only'
import { createHmac, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Centro de Comando (Fase 2) — endpoint de ingestão de telemetria dos sites externos dos clientes.
 * TEM de ser um Route Handler (não uma Server Action): o site do cliente entrega estes eventos com
 * um POST HTTP direto, de outro servidor — não passa pelo protocolo interno do Next.js.
 *
 * Segurança: `x-billtech-api-key` identifica o site; `x-billtech-signature` é o HMAC-SHA256 do
 * corpo em bruto, assinado com essa mesma chave — garante que o payload não foi adulterado em
 * trânsito. A chave NUNCA deve estar no browser do cliente final: tem de ser usada do lado do
 * servidor do site do cliente (ver exemplo em /admin/command-center).
 */
export const runtime = 'nodejs'

const telemetrySchema = z.object({
  metricType: z.enum(['page_view', 'error', 'uptime']),
  value: z.record(z.string(), z.unknown()).optional().default({}),
  occurredAt: z.iso.datetime().optional(),
})

function safeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'hex')
    const bufB = Buffer.from(b, 'hex')
    return bufA.length === bufB.length && bufA.length > 0 && timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-billtech-api-key')
  const signature = request.headers.get('x-billtech-signature')
  if (!apiKey || !signature) return NextResponse.json({ error: 'Cabeçalhos em falta.' }, { status: 401 })

  // CRÍTICO: ler o corpo em bruto, nunca fazer JSON.parse antes de verificar a assinatura — a
  // verificação precisa dos bytes exatos que o cliente assinou.
  const rawBody = await request.text()

  const db = createAdminClient()
  const { data: site } = await db.from('external_sites').select('id, api_key, status').eq('api_key', apiKey).maybeSingle()
  if (!site) return NextResponse.json({ error: 'Chave inválida.' }, { status: 401 })

  const expectedSignature = createHmac('sha256', site.api_key).update(rawBody).digest('hex')
  if (!safeEqualHex(signature, expectedSignature)) return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 })

  if (site.status === 'inativo') return NextResponse.json({ error: 'Site inativo.' }, { status: 403 })

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = telemetrySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })

  const now = new Date().toISOString()
  await Promise.all([
    db.from('telemetry_logs').insert({
      external_site_id: site.id,
      metric_type: parsed.data.metricType,
      value: parsed.data.value,
      occurred_at: parsed.data.occurredAt ?? now,
    }),
    db.from('external_sites').update({ last_ping_at: now }).eq('id', site.id),
  ])

  return NextResponse.json({ received: true })
}
