import type { Metadata } from 'next'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { deleteExternalSite } from '@/actions/external-sites'
import { ConfirmButton } from '@/components/admin/editor/confirm-button'
import { NewSiteModal } from '@/components/admin/command-center/new-site-modal'
import { listExternalSites } from '@/lib/command-center/queries'
import { listPortalClients } from '@/lib/finance/admin-queries'

export const metadata: Metadata = { title: 'Centro de Comando' }

const statusStyles = { ativo: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300', inativo: 'bg-muted text-muted-foreground' }
const statusLabels = { ativo: 'Ativo', inativo: 'Inativo' }

export default async function CommandCenterPage() {
  const [sites, clients] = await Promise.all([listExternalSites(), listPortalClients()])

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Centro de Comando</h1>
          <p className="mt-1 text-muted-foreground">Sites externos dos clientes e as respetivas chaves de API para telemetria.</p>
        </div>
        <NewSiteModal clients={clients.map((c) => ({ id: c.id, name: c.name }))} />
      </div>

      {sites.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Ainda não há sites externos registados.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">Cliente</th>
                <th scope="col" className="px-4 py-3">Site</th>
                <th scope="col" className="px-4 py-3">Domínio</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Último ping</th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sites.map((s) => (
                <tr key={s.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/clientes/${s.clientId}`} className="hover:underline">
                      {s.clientName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/command-center/${s.id}`} className="hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.domain}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[s.status]}`}>{statusLabels[s.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.lastPingAt ? new Date(s.lastPingAt).toLocaleString('pt-PT', { timeZone: 'UTC' }) : 'Nunca'}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteExternalSite}>
                      <input type="hidden" name="id" value={s.id} />
                      <ConfirmButton message={`Remover o site "${s.name}"? A telemetria associada também é apagada.`} variant="ghost" size="icon-sm" aria-label={`Remover ${s.name}`}>
                        <Trash2 className="size-3.5" aria-hidden />
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
