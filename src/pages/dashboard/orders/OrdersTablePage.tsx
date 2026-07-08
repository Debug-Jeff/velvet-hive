import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import DataTable, { type DataTableColumn } from '@/components/dashboard/DataTable/DataTable'
import DataTableToolbar from '@/components/dashboard/DataTable/DataTableToolbar'
import * as ordersApi from '@/api/orders.api'
import { ApiError } from '@/api/client'
import { ORDER_STATUS_LABELS, orderStatusVariant } from '@/lib/orderStatus'
import type { Order, OrderStatus } from '@/types/order'

const STALE_AFTER_MS = 24 * 60 * 60 * 1000 // half of the 48h auto-cancel window

function isAging(order: Order) {
  return order.status === 'PENDING_PAYMENT' && Date.now() - new Date(order.createdAt).getTime() > STALE_AFTER_MS
}

const STATUS_FILTER_OPTIONS = [
  { label: 'All statuses', value: 'ALL' },
  ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ label, value })),
]

export default function OrdersTablePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    ordersApi
      .listOrders()
      .then(setOrders)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Failed to load orders'))
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.id.toLowerCase().includes(search.toLowerCase()) || o.shippingName.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'ALL' || o.status === (statusFilter as OrderStatus)
      return matchesSearch && matchesStatus
    })
  }, [orders, search, statusFilter])

  const columns: DataTableColumn<Order>[] = [
    {
      key: 'id',
      header: 'Order',
      render: (o) => (
        <Link to={`/dashboard/orders/${o.id}`} className="font-mono text-xs text-primary hover:underline">
          {o.id.slice(-8)}
        </Link>
      ),
    },
    { key: 'customer', header: 'Customer', render: (o) => o.shippingName },
    { key: 'items', header: 'Items', render: (o) => o.items.reduce((sum, i) => sum + i.quantity, 0) },
    { key: 'total', header: 'Total', render: (o) => `KSh ${o.totalKes.toLocaleString()}` },
    {
      key: 'status',
      header: 'Status',
      render: (o) => (
        <div className="flex items-center gap-1.5">
          <Badge variant={orderStatusVariant(o.status)}>{ORDER_STATUS_LABELS[o.status]}</Badge>
          {isAging(o) && (
            <Badge variant="destructive" className="gap-1">
              <Clock className="size-3" /> Aging
            </Badge>
          )}
        </div>
      ),
    },
    { key: 'date', header: 'Placed', render: (o) => new Date(o.createdAt).toLocaleDateString() },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground">{orders.length} orders placed</p>
      </div>

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by order id or customer…"
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={STATUS_FILTER_OPTIONS}
        filterPlaceholder="Status"
      />

      <DataTable columns={columns} data={filtered} getRowId={(o) => o.id} isLoading={isLoading} emptyMessage="No orders found." />
    </div>
  )
}
