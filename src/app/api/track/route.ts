import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { hasServiceRole } from '@/lib/contact-delivery'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  kind: z.enum(['view', 'beat']),
  sid: z.string().regex(/^[A-Za-z0-9-]{8,64}$/),
  path: z.string().max(200).regex(/^\/[^\s]*$/),
  referrer: z.string().max(300).optional(),
})

// Áreas privadas nunca entram nas estatísticas
const IGNORED_PREFIXES = ['/admin', '/area-cliente', '/entrar', '/conta', '/api', '/auth']
const BOT_REGEX = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|monitor|curl|wget|python-requests/i

function deviceOf(ua: string): 'desktop' | 'mobile' | 'tablet' {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'tablet'
  if (/mobi|iphone|android/i.test(ua)) return 'mobile'
  return 'desktop'
}

/** Só o domínio de origem; o próprio site conta como tráfego direto. */
function sourceOf(referrer: string | undefined, host: string): string {
  if (!referrer) return 'direto'
  try {
    const h = new URL(referrer).hostname.replace(/^www\./, '')
    return h === host.replace(/^www\./, '').split(':')[0] ? 'direto' : h.slice(0, 80)
  } catch {
    return 'direto'
  }
}

// Limite simples por IP (em memória): trava abusos básicos; em serverless é por instância
const hits = new Map<string, { count: number; reset: number }>()
function allowed(ip: string) {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + 60_000 })
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k)
    return true
  }
  return ++entry.count <= 60
}

/**
 * Recebe visitas e batimentos da landing. Não guarda IP nem user-agent: apenas
 * um id de sessão aleatório (sessionStorage), o caminho, o domínio de origem e o tipo de dispositivo.
 */
export async function POST(request: NextRequest) {
  if (!hasServiceRole()) return new NextResponse(null, { status: 204 })

  const ua = request.headers.get('user-agent') ?? ''
  if (!ua || BOT_REGEX.test(ua)) return new NextResponse(null, { status: 204 })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!allowed(ip)) return new NextResponse(null, { status: 429 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return new NextResponse(null, { status: 400 })
  const { kind, sid, path, referrer } = parsed.data
  if (IGNORED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return new NextResponse(null, { status: 204 })

  const { error } = await createAdminClient().rpc('analytics_track', {
    p_kind: kind,
    p_sid: sid,
    p_path: path.split('?')[0].split('#')[0],
    p_ref: sourceOf(referrer, request.nextUrl.host),
    p_device: deviceOf(ua),
  })
  if (error) console.error('[analytics] track:', error.message)

  return new NextResponse(null, { status: 204 })
}
