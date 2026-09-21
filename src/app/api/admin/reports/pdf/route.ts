import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentProfile } from '@/lib/auth'
import { REPORT_PERIODS, type ReportPeriod } from '@/lib/admin/reports'

export const dynamic = 'force-dynamic'

/**
 * Endpoint de exportação de relatório em PDF — PREPARADO, ainda não implementado.
 *
 * Para integrar: gerar o PDF aqui (react-pdf/renderer ou puppeteer a abrir /admin/reports?periodo=…),
 * devolver `new Response(buffer, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=…' } })`
 * e registar a exportação em logAudit (ação EXPORT_REVENUE ou uma nova, EXPORT_REPORT).
 * A autorização e a validação do período já estão feitas.
 */
export async function GET(request: NextRequest) {
  const profile = await getCurrentProfile()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const periodo = request.nextUrl.searchParams.get('periodo') ?? ''
  if (!(REPORT_PERIODS as readonly string[]).includes(periodo)) return NextResponse.json({ error: 'Período inválido' }, { status: 400 })

  return NextResponse.json({ status: 'not_implemented', periodo: periodo as ReportPeriod, message: 'A geração de PDF ainda não está integrada. O endpoint já está pronto para receber react-pdf ou puppeteer.' }, { status: 501 })
}
