import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import DataTable, { type DataTableColumn } from '@/components/dashboard/DataTable/DataTable'
import DataTableToolbar from '@/components/dashboard/DataTable/DataTableToolbar'
import DateRangePicker, { type DateRangeValue } from '@/components/dashboard/DateRangePicker'
import ExportCsvButton from '@/components/dashboard/ExportCsvButton'
import * as ordersApi from '@/api/orders.api'
import { ApiError } from '@/api/client'
import { ORDER_STATUS_LABELS, orderStatusVariant } from '@/lib/orderStatus'
import type { Order, OrderStatus } from '@/types/order'

const STALE_AFTER_MS = 24 * 60 * 60 * 1000 // half of the 48h auto-cancel window

function isAging(order: Order) {
  return order.status === 'PENDING_PAYMENT' && Date.now() - new Date(order.createdAt).getTime() > STALE_AFTER_MS
}

const PAYMENT_METHOD_LABELS: Record<string, string> = { CARD: 'Paystack', MPESA: 'M-Pesa' }

function paymentMethodLabel(order: Order) {
  const successful = order.payments.find((p) => p.status === 'SUCCESS')
  if (successful) return PAYMENT_METHOD_LABELS[successful.method] ?? successful.method
  const latest = order.payments[order.payments.length - 1]
  return latest ? PAYMENT_METHOD_LABELS[latest.method] ?? latest.method : '—'
}

const STATUS_FILTER_OPTIONS = [
  { label: 'All statuses', value: 'ALL' },
  ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ label, value })),
]

const PAYMENT_METHOD_FILTER_OPTIONS = [
  { label: 'All payment methods', value: 'ALL' },
  { label: 'Paystack', value: 'CARD' },
  { label: 'M-Pesa', value: 'MPESA' },
]

export default function OrdersTablePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL')
  const [range, setRange] = useState<DateRangeValue>({})

  useEffect(() => {
    setIsLoading(true)
    ordersApi
      .listOrders(range)
      .then(setOrders)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Failed to load orders'))
      .finally(() => setIsLoading(false))
  }, [range])

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.id.toLowerCase().includes(search.toLowerCase()) || o.shippingName.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'ALL' || o.status === (statusFilter as OrderStatus)
      const matchesPaymentMethod = paymentMethodFilter === 'ALL' || o.payments.some((p) => p.method === paymentMethodFilter)
      return matchesSearch && matchesStatus && matchesPaymentMethod
    })
  }, [orders, search, statusFilter, paymentMethodFilter])

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
    { key: 'payment', header: 'Payment', render: (o) => <Badge variant="outline">{paymentMethodLabel(o)}</Badge> },
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground">{orders.length} orders placed</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={range} onChange={setRange} />
          <ExportCsvButton
            filename="orders.csv"
            headers={['Order ID', 'Customer', 'Items', 'Total (KES)', 'Payment', 'Status', 'Date']}
            rows={filtered.map((o) => [
              o.id,
              o.shippingName,
              o.items.reduce((sum, i) => sum + i.quantity, 0),
              o.totalKes,
              paymentMethodLabel(o),
              ORDER_STATUS_LABELS[o.status],
              new Date(o.createdAt).toLocaleDateString(),
            ])}
          />
        </div>
      </div>

      <DataTableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by order id or customer…"
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={STATUS_FILTER_OPTIONS}
        filterPlaceholder="Status"
        filter2Value={paymentMethodFilter}
        onFilter2Change={setPaymentMethodFilter}
        filter2Options={PAYMENT_METHOD_FILTER_OPTIONS}
        filter2Placeholder="Payment method"
      />

      <DataTable columns={columns} data={filtered} getRowId={(o) => o.id} isLoading={isLoading} emptyMessage="No orders found." />
    </div>
  )
}
