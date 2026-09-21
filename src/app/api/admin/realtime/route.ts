import { NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth'
import { getRealtimeUsers } from '@/lib/admin/analytics'

export const dynamic = 'force-dynamic'

/** Utilizadores online agora. Só para administradores: os Route Handlers não passam pelo layout do admin. */
export async function GET() {
  const profile = await getCurrentProfile()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  return NextResponse.json(await getRealtimeUsers(), { headers: { 'Cache-Control': 'no-store' } })
}
