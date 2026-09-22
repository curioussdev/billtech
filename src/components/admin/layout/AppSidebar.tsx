'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Code2, ExternalLink, LogOut } from 'lucide-react'
import { logout } from '@/actions/auth'
import { adminNav, isActive } from '@/components/admin/layout/nav'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAdminRequestsRealtime } from '@/hooks/use-realtime-portal'

export function AppSidebar({ email, unreadRequests }: { email: string; unreadRequests: number }) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  useAdminRequestsRealtime()
  // Em mobile a sidebar é uma gaveta: fecha ao navegar
  const closeOnNavigate = () => isMobile && setOpenMobile(false)

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <Link href="/admin" onClick={closeOnNavigate} className="flex items-center gap-2 rounded-md p-2 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
          <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Code2 className="size-4" aria-hidden />
          </span>
          <span className="grid leading-tight">
            <span className="text-sm font-bold">BillTech</span>
            <span className="text-xs text-muted-foreground">Painel executivo</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {adminNav.map((group, index) => (
          <div key={group.label}>
            {index > 0 && <SidebarSeparator className="mx-0" />}
            <SidebarGroup>
              <SidebarGroupLabel className="text-[0.7rem] font-bold uppercase tracking-widest">{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(pathname, item)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        render={<Link href={item.href} onClick={closeOnNavigate} aria-current={active && !item.children ? 'page' : undefined} />}
                      >
                        <item.icon aria-hidden />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      {item.badge === 'requests' && unreadRequests > 0 && (
                        <SidebarMenuBadge>
                          {unreadRequests}
                          <span className="sr-only"> por ler</span>
                        </SidebarMenuBadge>
                      )}
                      {item.children && active && (
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.href}>
                              <SidebarMenuSubButton isActive={pathname === child.href} render={<Link href={child.href} onClick={closeOnNavigate} aria-current={pathname === child.href ? 'page' : undefined} />}>
                                <span>{child.title}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator className="mx-0" />
        <div className="flex items-center justify-between gap-2 px-2">
          <p className="truncate text-xs text-muted-foreground" title={email}>
            {email}
          </p>
          <ThemeToggle />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/" target="_blank" rel="noopener noreferrer" />}>
              <ExternalLink aria-hidden />
              <span>Ver site</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={logout}>
              <SidebarMenuButton type="submit">
                <LogOut aria-hidden />
                <span>Sair</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
