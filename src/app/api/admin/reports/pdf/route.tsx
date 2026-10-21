import { renderToBuffer } from '@react-pdf/renderer'
import { NextResponse, type NextRequest } from 'next/server'
import { businessNow, listLeads, listProjects } from '@/lib/admin/analytics'
import { ReportPdfDocument } from '@/lib/admin/report-pdf'
import { buildReport, REPORT_PERIODS, type ReportPeriod } from '@/lib/admin/reports'
import { logAudit } from '@/lib/audit'
import { getCurrentProfile } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** Exportação do relatório periódico em PDF — gerado no servidor com @react-pdf/renderer. */
export async function GET(request: NextRequest) {
  const profile = await getCurrentProfile()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const periodo = request.nextUrl.searchParams.get('periodo') ?? ''
  if (!(REPORT_PERIODS as readonly string[]).includes(periodo)) return NextResponse.json({ error: 'Período inválido' }, { status: 400 })

  const [projects, leads] = await Promise.all([listProjects(), listLeads()])
  const report = buildReport(periodo as ReportPeriod, projects, leads, businessNow())

  let buffer: Buffer
  try {
    buffer = await renderToBuffer(<ReportPdfDocument report={report} />)
  } catch (error) {
    console.error('[reports] geração de PDF falhou:', error)
    return NextResponse.json({ error: 'Não foi possível gerar o PDF.' }, { status: 500 })
  }

  await logAudit({ admin: profile, action: 'EXPORT_REPORT_PDF', resource: 'negocio', details: { periodo } })

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio-${periodo}.pdf"`,
    },
  })
}
