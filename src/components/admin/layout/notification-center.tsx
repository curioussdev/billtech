'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, CalendarClock, LifeBuoy, Receipt, Trophy, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { AdminNotifications } from '@/lib/admin/notifications'

/** Centro de notificações do admin — agrega pedidos, alterações pendentes, faturas em atraso, reuniões e negócios fechados num só sítio. */
export function AdminNotificationCenter({ unreadRequests, pendingChangeRequests, overdueInvoices, upcomingMeetings, recentWins }: AdminNotifications) {
  const [open, setOpen] = useState(false)
  const urgentTotal = unreadRequests.length + pendingChangeRequests.length + overdueInvoices.length

  const sections = [
    { key: 'pedidos', title: 'Pedidos por ler', icon: LifeBuoy, items: unreadRequests },
    { key: 'alteracoes', title: 'Alterações pendentes de aprovação', icon: UserCog, items: pendingChangeRequests },
    { key: 'faturas', title: 'Faturas em atraso', icon: Receipt, items: overdueInvoices },
    { key: 'reunioes', title: 'Reuniões nos próximos 7 dias', icon: CalendarClock, items: upcomingMeetings },
    { key: 'ganhos', title: 'Negócios ganhos (7 dias)', icon: Trophy, items: recentWins },
  ]
  const allEmpty = sections.every((s) => s.items.length === 0)

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label={`Notificações${urgentTotal > 0 ? ` (${urgentTotal} a precisar de atenção)` : ''}`}
        className="relative ml-auto"
      >
        <Bell aria-hidden />
        {urgentTotal > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[0.65rem] font-bold leading-none text-primary-foreground">
            {urgentTotal > 9 ? '9+' : urgentTotal}
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
            {allEmpty && <p className="text-sm text-muted-foreground">Sem novidades por agora.</p>}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
