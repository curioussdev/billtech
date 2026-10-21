import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { formatEUR, formatInt, formatPct, sectorLabels } from '@/lib/admin/format'
import type { Metric, ReportData } from '@/lib/admin/reports'

/**
 * PDF do relatório periódico — gerado no servidor com @react-pdf/renderer (sem Chromium/puppeteer:
 * mais leve e mais previsível num ambiente serverless). Espelha o conteúdo de
 * `components/admin/business/report-view.tsx`, mas é uma árvore de componentes à parte — o
 * @react-pdf/renderer não usa HTML/Tailwind, tem os seus próprios primitivos de layout.
 */

const colors = { ink: '#18202b', muted: '#6b7280', border: '#e2e4e8', primary: '#0f6a70', up: '#047857', down: '#b91c1c' }

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: colors.ink, fontFamily: 'Helvetica' },
  brand: { fontSize: 10, fontWeight: 700, color: colors.primary, marginBottom: 4 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  range: { fontSize: 10, color: colors.muted, marginBottom: 18 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 8, marginTop: 16 },
  paragraph: { fontSize: 10, lineHeight: 1.5, marginBottom: 6 },
  cardsRow: { flexDirection: 'row', gap: 10 },
  card: { flex: 1, border: `1pt solid ${colors.border}`, borderRadius: 6, padding: 10 },
  cardLabel: { fontSize: 8, color: colors.muted, marginBottom: 4 },
  cardValue: { fontSize: 14, fontWeight: 700, marginBottom: 2 },
  cardChange: { fontSize: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  rank: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#e6f2f2', textAlign: 'center', fontSize: 7, paddingTop: 3, color: colors.primary, fontWeight: 700 },
  listTitle: { fontSize: 9, fontWeight: 700 },
  listSub: { fontSize: 8, color: colors.muted },
  listValue: { fontSize: 9, fontWeight: 700, marginLeft: 'auto' },
  table: { border: `1pt solid ${colors.border}`, borderRadius: 6, overflow: 'hidden' },
  tr: { flexDirection: 'row', borderBottom: `1pt solid ${colors.border}` },
  thRow: { flexDirection: 'row', backgroundColor: '#f4f5f7', borderBottom: `1pt solid ${colors.border}` },
  th: { flex: 1, padding: 6, fontSize: 8, color: colors.muted, textTransform: 'uppercase' },
  td: { flex: 1, padding: 6, fontSize: 9 },
  forecastBox: { border: `1pt solid ${colors.border}`, borderRadius: 6, padding: 12, marginTop: 16 },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, fontSize: 7, color: colors.muted, textAlign: 'center' },
})

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

function ChangeLabel({ metric }: { metric: Metric }) {
  if (metric.changePct === null) return <Text style={[styles.cardChange, { color: colors.muted }]}>sem período anterior</Text>
  const up = metric.changePct >= 0
  return <Text style={[styles.cardChange, { color: up ? colors.up : colors.down }]}>{up ? '▲' : '▼'} {formatPct(Math.abs(metric.changePct))}</Text>
}

export function ReportPdfDocument({ report }: { report: ReportData }) {
  const rows: { label: string; metric: Metric; format: (n: number) => string }[] = [
    { label: 'Receita', metric: report.revenue, format: formatEUR },
    { label: 'Projetos vendidos', metric: report.projectsSold, format: formatInt },
    { label: 'Novos leads', metric: report.newLeads, format: formatInt },
    { label: 'Taxa de fecho', metric: report.closeRatePct, format: (n) => formatPct(n) },
  ]

  return (
    <Document title={`${report.title} — BillTech`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>BillTech</Text>
        <Text style={styles.title}>{report.title}</Text>
        <Text style={styles.range}>
          {dateLabel(report.from)} — {dateLabel(report.to)} ({report.rangeLabel})
        </Text>

        <Text style={styles.sectionTitle}>Resumo executivo</Text>
        {report.summary.map((paragraph, i) => (
          <Text key={i} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}

        <Text style={styles.sectionTitle}>Indicadores</Text>
        <View style={styles.cardsRow}>
          {rows.map((r) => (
            <View key={r.label} style={styles.card}>
              <Text style={styles.cardLabel}>{r.label}</Text>
              <Text style={styles.cardValue}>{r.format(r.metric.value)}</Text>
              <ChangeLabel metric={r.metric} />
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Top 3 projetos por receita</Text>
            {report.topProjects.length === 0 ? (
              <Text style={[styles.paragraph, { color: colors.muted }]}>Sem projetos vendidos neste período.</Text>
            ) : (
              report.topProjects.map((p, i) => (
                <View key={p.id} style={styles.listItem}>
                  <Text style={styles.rank}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{p.client}</Text>
                    <Text style={styles.listSub}>{p.name}</Text>
                  </View>
                  <Text style={styles.listValue}>{formatEUR(p.value)}</Text>
                </View>
              ))
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Top 3 setores por demanda</Text>
            {report.topSectors.length === 0 ? (
              <Text style={[styles.paragraph, { color: colors.muted }]}>Sem atividade neste período.</Text>
            ) : (
              report.topSectors.map((s, i) => (
                <View key={s.sector} style={styles.listItem}>
                  <Text style={styles.rank}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{sectorLabels[s.sector]}</Text>
                    <Text style={styles.listSub}>
                      {s.leads} leads · {s.projects} projetos · {formatEUR(s.revenue)}
                    </Text>
                  </View>
                  <Text style={styles.listValue}>{s.demand}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Comparativo com o período anterior</Text>
        <View style={styles.table}>
          <View style={styles.thRow}>
            <Text style={styles.th}>Indicador</Text>
            <Text style={[styles.th, { textAlign: 'right' }]}>Atual</Text>
            <Text style={[styles.th, { textAlign: 'right' }]}>Anterior</Text>
            <Text style={[styles.th, { textAlign: 'right' }]}>Variação</Text>
          </View>
          {rows.map((r, i) => (
            <View key={r.label} style={i === rows.length - 1 ? { flexDirection: 'row' } : styles.tr}>
              <Text style={[styles.td, { fontWeight: 700 }]}>{r.label}</Text>
              <Text style={[styles.td, { textAlign: 'right' }]}>{r.format(r.metric.value)}</Text>
              <Text style={[styles.td, { textAlign: 'right', color: colors.muted }]}>{r.format(r.metric.previous)}</Text>
              <View style={[styles.td, { alignItems: 'flex-end' }]}>
                <ChangeLabel metric={r.metric} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.forecastBox}>
          <Text style={[styles.cardLabel, { marginBottom: 6 }]}>Previsão · {report.forecast.label}</Text>
          <Text style={[styles.cardValue, { fontSize: 18 }]}>{formatEUR(report.forecast.value)}</Text>
          <Text style={[styles.cardChange, { color: colors.muted, marginTop: 4 }]}>{report.forecast.method}. É uma estimativa simples, não uma garantia.</Text>
        </View>

        <Text style={styles.footer} fixed>
          Gerado automaticamente pela plataforma BillTech em {new Date().toLocaleString('pt-PT', { timeZone: 'UTC' })} UTC.
        </Text>
      </Page>
    </Document>
  )
}
