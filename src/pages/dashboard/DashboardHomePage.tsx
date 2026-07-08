import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Users, ShoppingCart, Package, AlertTriangle } from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useAuth } from '@/context/AuthContext'
import { roleHasPermission } from '@/constants/permissions'
import { ORDER_STATUS_LABELS } from '@/lib/orderStatus'
import * as usersApi from '@/api/users.api'
import * as ordersApi from '@/api/orders.api'
import * as productsApi from '@/api/products.api'
import type { Order } from '@/types/order'
import type { Product } from '@/types/product'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  ACCOUNTS: 'Accounts',
  INVENTORY_CLERK: 'Inventory Clerk',
  CUSTOMER: 'Customer',
}

const REVENUE_STATUSES = new Set(['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'])

const statusChartConfig = {
  count: { label: 'Orders', color: 'var(--chart-2)' },
} satisfies ChartConfig

const revenueChartConfig = {
  revenue: { label: 'Revenue (KSh)', color: 'var(--chart-1)' },
} satisfies ChartConfig

export default function DashboardHomePage() {
  const { user } = useAuth()
  const [userCount, setUserCount] = useState<number | null>(null)
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const canSeeUsers = user && roleHasPermission(user.roleName, 'users:manage')
  const canSeeOrders = user && roleHasPermission(user.roleName, 'orders:read:all')
  const canSeeStockReports = user && roleHasPermission(user.roleName, 'reports:stock:read')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const tasks: Promise<void>[] = [
        productsApi.listProducts().then((data) => {
          if (!cancelled) setProducts(data)
        }),
      ]
      if (canSeeUsers) {
        tasks.push(
          usersApi.listUsers().then((users) => {
            if (!cancelled) setUserCount(users.length)
          }),
        )
      }
      if (canSeeOrders) {
        tasks.push(
          ordersApi.listOrders().then((data) => {
            if (!cancelled) setOrders(data)
          }),
        )
      }
      await Promise.allSettled(tasks)
      if (!cancelled) setIsLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [canSeeUsers, canSeeOrders])

  const ordersByStatus = useMemo(() => {
    if (!orders) return []
    const byStatus = new Map<string, number>()
    for (const o of orders) byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1)
    return Array.from(byStatus.entries()).map(([status, count]) => ({ status: ORDER_STATUS_LABELS[status as Order['status']], count }))
  }, [orders])

  const revenueByDay = useMemo(() => {
    if (!orders) return []
    const byDay = new Map<string, number>()
    for (const o of orders) {
      if (!REVENUE_STATUSES.has(o.status)) continue
      const day = new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      byDay.set(day, (byDay.get(day) ?? 0) + o.totalKes)
    }
    return Array.from(byDay.entries()).map(([day, revenue]) => ({ day, revenue }))
  }, [orders])

  const lowStockProducts = useMemo(() => {
    if (!products) return []
    return products
      .filter((p) => p.stockQuantity <= p.reorderThreshold)
      .sort((a, b) => a.stockQuantity - b.stockQuantity)
      .slice(0, 5)
  }, [products])

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
        <CardContent className="flex flex-col gap-1 py-2">
          <p className="text-sm text-primary-foreground/80">
            {user && ROLE_LABELS[user.roleName]} dashboard
          </p>
          <h1 className="text-2xl font-semibold">Welcome{user?.firstName ? `, ${user.firstName}` : ''}</h1>
          <p className="text-sm text-primary-foreground/80">Here's what's happening across the platform.</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Products" value={products?.length ?? null} icon={Package} isLoading={isLoading} accent="blue" />
        {canSeeOrders && <StatCard label="Orders" value={orders?.length ?? null} icon={ShoppingCart} isLoading={isLoading} accent="green" />}
        {canSeeUsers && <StatCard label="Users" value={userCount} icon={Users} isLoading={isLoading} accent="amber" />}
      </div>

      {canSeeOrders && !isLoading && (revenueByDay.length > 0 || ordersByStatus.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {revenueByDay.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={revenueChartConfig} className="h-56 w-full">
                  <LineChart data={revenueByDay}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {ordersByStatus.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Orders by status</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={statusChartConfig} className="h-56 w-full">
                  <BarChart data={ordersByStatus} layout="vertical">
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis dataKey="status" type="category" tickLine={false} axisLine={false} fontSize={12} width={90} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!isLoading && lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-destructive" /> Low stock alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{p.sku}</span>
                    <Badge variant="outline" className="font-normal">{p.category}</Badge>
                  </div>
                </div>
                <Badge variant="destructive">{p.stockQuantity} left</Badge>
              </div>
            ))}
            {canSeeStockReports && (
              <Link to="/dashboard/reports/stock" className="mt-2 block text-xs font-medium text-primary hover:underline">
                View full stock report
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
