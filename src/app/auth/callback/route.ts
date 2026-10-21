import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Caminhos de destino permitidos depois da troca de sessão — nunca seguimos um `next` arbitrário (evita open redirect). */
const ALLOWED_NEXT = new Set(['/conta', '/auth/definir-password'])

/**
 * Destino do link de confirmação de email enviado pelo Supabase (convite, recuperação de password,
 * confirmação de signup). `next` escolhe a página final depois da troca de sessão — por omissão
 * `/conta` (que reencaminha para a área certa); os fluxos de password usam `/auth/definir-password`.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = request.nextUrl.searchParams.get('next')
  const destination = next && ALLOWED_NEXT.has(next) ? next : '/conta'
  const origin = request.nextUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${destination}`)
  }
  return NextResponse.redirect(`${origin}/entrar?erro=confirmacao`)
}
