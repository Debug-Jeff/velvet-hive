import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import StatCard from '@/components/dashboard/StatCard'
import DataTable, { type DataTableColumn } from '@/components/dashboard/DataTable/DataTable'
import * as ordersApi from '@/api/orders.api'
import { ApiError } from '@/api/client'
import { ORDER_STATUS_LABELS, orderStatusVariant } from '@/lib/orderStatus'
import type { Order } from '@/types/order'

const REVENUE_STATUSES = new Set(['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'])

const revenueChartConfig = {
  revenue: { label: 'Revenue (KSh)', color: 'var(--chart-1)' },
} satisfies ChartConfig

const statusChartConfig = {
  count: { label: 'Orders', color: 'var(--chart-2)' },
} satisfies ChartConfig

export default function FinancialReportPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    ordersApi
      .listOrders()
      .then(setOrders)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Failed to load orders'))
      .finally(() => setIsLoading(false))
  }, [])

  const { totalRevenue, paidCount, avgOrderValue } = useMemo(() => {
    const paid = orders.filter((o) => REVENUE_STATUSES.has(o.status))
    const revenue = paid.reduce((sum, o) => sum + o.totalKes, 0)
    return {
      totalRevenue: revenue,
      paidCount: paid.length,
      avgOrderValue: paid.length ? Math.round(revenue / paid.length) : 0,
    }
  }, [orders])

  const revenueByDay = useMemo(() => {
    const byDay = new Map<string, number>()
    for (const o of orders) {
      if (!REVENUE_STATUSES.has(o.status)) continue
      const day = new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      byDay.set(day, (byDay.get(day) ?? 0) + o.totalKes)
    }
    return Array.from(byDay.entries()).map(([day, revenue]) => ({ day, revenue }))
  }, [orders])

  const ordersByStatus = useMemo(() => {
    const byStatus = new Map<string, number>()
    for (const o of orders) {
      byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1)
    }
    return Array.from(byStatus.entries()).map(([status, count]) => ({ status: ORDER_STATUS_LABELS[status as Order['status']], count }))
  }, [orders])

  const columns: DataTableColumn<Order>[] = [
    { key: 'id', header: 'Order', render: (o) => <span className="font-mono text-xs">{o.id.slice(-8)}</span> },
    { key: 'customer', header: 'Customer', render: (o) => o.shippingName },
    { key: 'total', header: 'Total', render: (o) => `KSh ${o.totalKes.toLocaleString()}` },
    { key: 'status', header: 'Status', render: (o) => <Badge variant={orderStatusVariant(o.status)}>{ORDER_STATUS_LABELS[o.status]}</Badge> },
    { key: 'date', header: 'Date', render: (o) => new Date(o.createdAt).toLocaleDateString() },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Financial Reports</h1>
        <p className="text-sm text-muted-foreground">Revenue and order performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total revenue" value={`KSh ${totalRevenue.toLocaleString()}`} icon={DollarSign} isLoading={isLoading} accent="green" />
        <StatCard label="Paid orders" value={paidCount} icon={ShoppingCart} isLoading={isLoading} accent="blue" />
        <StatCard label="Avg. order value" value={`KSh ${avgOrderValue.toLocaleString()}`} icon={TrendingUp} isLoading={isLoading} accent="amber" />
      </div>

      {!isLoading && orders.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue by day</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={revenueChartConfig} className="h-64 w-full">
                <BarChart data={revenueByDay}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Orders by status</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={statusChartConfig} className="h-64 w-full">
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
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-medium">All orders</h2>
        <DataTable columns={columns} data={orders} getRowId={(o) => o.id} isLoading={isLoading} emptyMessage="No orders yet." pageSize={15} />
      </div>
    </div>
  )
}
