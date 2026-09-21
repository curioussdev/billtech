import { ImageResponse } from 'next/og'

export const alt = 'BillTech — Tecnologia que opera o seu negócio'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: '#0e1219',
          color: '#fafaf7',
        }}
      >
        <div style={{ display: 'flex', fontSize: 44, fontWeight: 800 }}>
          Bill<span style={{ color: '#5fd3d0' }}>Tech</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            Transforme processos manuais em receita digital previsível.
          </div>
          <div style={{ marginTop: 28, fontSize: 30, color: '#b4bcc8' }}>Desenvolvimento para PMEs · Automação · Sistemas sob medida</div>
        </div>
      </div>
    ),
    size,
  )
}
