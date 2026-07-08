import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Users,
  LineChart,
  BarChart3,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'
import type { Permission } from '@/constants/permissions'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  permission?: Permission
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Catalog & Sales',
    items: [
      { label: 'Products', to: '/dashboard/products', icon: Package, permission: 'products:read' },
      { label: 'Orders', to: '/dashboard/orders', icon: ShoppingCart, permission: 'orders:read:all' },
      { label: 'Inventory', to: '/dashboard/inventory', icon: Boxes, permission: 'inventory:read' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Financial Reports', to: '/dashboard/reports/financial', icon: LineChart, permission: 'reports:financial:read' },
      { label: 'Stock Reports', to: '/dashboard/reports/stock', icon: BarChart3, permission: 'reports:stock:read' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Users & Roles', to: '/dashboard/users', icon: Users, permission: 'users:manage' },
      { label: 'Security & Logs', to: '/dashboard/security', icon: ShieldAlert, permission: 'users:manage' },
    ],
  },
]
