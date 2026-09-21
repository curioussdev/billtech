'use client'

import { Radio } from 'lucide-react'
import { KpiCard } from '@/components/admin/dashboard/kpi-card'
import { useRealtimeUsers } from '@/hooks/use-realtime-users'
import type { RealtimeUsers } from '@/types/analytics'

const time = (iso: string) => new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })

export function RealtimeUsersCard({ initial, delay }: { initial: RealtimeUsers; delay?: number }) {
  const { data, error } = useRealtimeUsers(initial)

  return (
    <KpiCard title="Utilizadores online agora" icon={<Radio className="size-4" />} delay={delay}>
      <div className="flex items-center gap-3">
        {/* Bolinha verde pulsante (animate-ping); parada se o utilizador preferir menos movimento */}
        <span className="relative flex size-3" aria-hidden>
          <span className={`absolute inline-flex size-full rounded-full ${error ? 'bg-amber-500' : 'bg-emerald-500'} opacity-75 motion-safe:animate-ping`} />
          <span className={`relative inline-flex size-3 rounded-full ${error ? 'bg-amber-500' : 'bg-emerald-500'}`} />
        </span>
        <p className="text-3xl font-black tabular-nums" aria-live="polite">
          {data.online}
          <span className="sr-only"> utilizadores online</span>
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        {data.peakToday > 0 ? (
          <>
            Pico de hoje: <strong className="font-semibold text-foreground">{data.peakToday}</strong> às {time(data.peakAt)}
          </>
        ) : (
          'Ainda sem visitas hoje.'
        )}
      </p>
      {data.pages.length > 0 && (
        <ul aria-label="Páginas a ser vistas agora" className="grid gap-1 border-t border-border pt-2 text-xs">
          {data.pages.slice(0, 4).map((p) => (
            <li key={p.path} className="flex justify-between gap-2">
              <span className="truncate text-muted-foreground">{p.path}</span>
              <strong className="tabular-nums">{p.online}</strong>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">{error ? 'Sem ligação — a mostrar o último valor.' : `Atualiza a cada 15 s · ${time(data.updatedAt)}`}</p>
    </KpiCard>
  )
}
