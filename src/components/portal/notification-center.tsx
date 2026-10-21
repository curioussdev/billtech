'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, FileClock, Inbox, LifeBuoy, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { formatDate } from '@/lib/portal/labels'
import type { ClientProjectEvent } from '@/lib/portal/queries'

export type NotificationItem = { id: string; label: string; href: string; hint?: string }

export function NotificationCenter({
  unreadRequests,
  unreadBroadcasts,
  overdueInvoices,
  recentEvents,
}: {
  unreadRequests: NotificationItem[]
  unreadBroadcasts: NotificationItem[]
  overdueInvoices: NotificationItem[]
  recentEvents: ClientProjectEvent[]
}) {
  const [open, setOpen] = useState(false)
  const total = unreadRequests.length + unreadBroadcasts.length + overdueInvoices.length

  const sections = [
    { key: 'pedidos', title: 'Pedidos por ler', icon: LifeBuoy, items: unreadRequests, emptyText: null },
    { key: 'mensagens', title: 'Comunicados por ler', icon: Inbox, items: unreadBroadcasts, emptyText: null },
    { key: 'faturas', title: 'Faturas em atraso', icon: Receipt, items: overdueInvoices, emptyText: null },
  ]

  return (
    <>
      <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label={`Notificações${total > 0 ? ` (${total} por ler)` : ''}`} className="relative">
        <Bell aria-hidden />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[0.65rem] font-bold leading-none text-primary-foreground">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Notificações</SheetTitle>
          </SheetHeader>
          <div className="grid gap-6 px-4 pb-4">
            {sections.map(
              (section) =>
                section.items.length > 0 && (
                  <div key={section.key} className="grid gap-2">
                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <section.icon className="size-3.5" aria-hidden /> {section.title}
                    </h3>
                    <ul className="grid gap-1.5">
                      {section.items.map((item) => (
                        <li key={item.id}>
                          <Link href={item.href} onClick={() => setOpen(false)} className="block rounded-lg border border-border bg-card px-3 py-2 text-sm hover:border-primary">
                            <span className="block truncate font-medium">{item.label}</span>
                            {item.hint && <span className="text-xs text-muted-foreground">{item.hint}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
            )}

            {recentEvents.length > 0 && (
              <div className="grid gap-2">
                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <FileClock className="size-3.5" aria-hidden /> Atividade dos projetos
                </h3>
                <ul className="grid gap-1.5">
                  {recentEvents.map((event) => (
                    <li key={event.id}>
                      <Link href={`/area-cliente/projetos/${event.project_id}`} onClick={() => setOpen(false)} className="block rounded-lg border border-border bg-card px-3 py-2 text-sm hover:border-primary">
                        <span className="block">{event.message}</span>
                        <span className="text-xs text-muted-foreground">
                          {event.projectName} · {formatDate(event.created_at)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {total === 0 && recentEvents.length === 0 && <p className="text-sm text-muted-foreground">Sem novidades por agora.</p>}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
