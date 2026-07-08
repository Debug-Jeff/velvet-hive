import { NavLink, useLocation } from 'react-router-dom'
import { ShoppingBasket, Settings } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { roleHasPermission } from '@/constants/permissions'
import { NAV_GROUPS } from './navConfig'

const ACTIVE_CLASSES =
  'data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:hover:bg-primary/15 data-[active=true]:hover:text-primary group-data-[collapsible=icon]:data-[active=true]:border-l-0'

export default function AppSidebar() {
  const { user } = useAuth()
  const location = useLocation()

  function isItemActive(to: string) {
    return to === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(to)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex-row items-center gap-2 overflow-hidden px-3 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShoppingBasket className="size-4" />
        </div>
        <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
          <span className="text-sm font-semibold whitespace-nowrap">Velvet Hive</span>
          <span className="text-xs whitespace-nowrap text-muted-foreground">Staff dashboard</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => !item.permission || (user && roleHasPermission(user.roleName, item.permission)))
          if (items.length === 0) return null

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={isItemActive(item.to)} tooltip={item.label} className={cn(ACTIVE_CLASSES)}>
                        <NavLink to={item.to}>
                          <item.icon />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === '/dashboard/settings'}
              tooltip="Settings"
              className={cn(ACTIVE_CLASSES)}
            >
              <NavLink to="/dashboard/settings">
                <Settings />
                <span>Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
