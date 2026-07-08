import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import CancelOrderDialog from '@/components/dashboard/CancelOrderDialog'
import { useAuth } from '@/context/AuthContext'
import { roleHasPermission } from '@/constants/permissions'
import * as ordersApi from '@/api/orders.api'
import { ApiError } from '@/api/client'
import { CANCELLABLE_FROM, MANUALLY_PROGRESSABLE_FROM, NEXT_STATUS_OPTIONS, ORDER_STATUS_LABELS, orderStatusVariant } from '@/lib/orderStatus'
import type { Order, OrderStatus } from '@/types/order'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const canUpdateStatus = user && roleHasPermission(user.roleName, 'orders:update:status')

  async function load() {
    if (!id) return
    setIsLoading(true)
    try {
      setOrder(await ordersApi.getOrder(id))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load order')
      navigate('/dashboard/orders')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleUpdateStatus() {
    if (!id || !nextStatus) return
    setIsUpdating(true)
    try {
      const updated = await ordersApi.updateOrderStatus(id, nextStatus)
      setOrder(updated)
      setNextStatus('')
      toast.success(`Order marked ${ORDER_STATUS_LABELS[nextStatus]}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update status')
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleCancel(reason: string) {
    if (!id) return
    setIsCancelling(true)
    try {
      const updated = await ordersApi.cancelOrder(id, reason)
      setOrder(updated)
      setCancelDialogOpen(false)
      toast.success('Order cancelled and customer notified')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to cancel order')
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!order) return null

  const canProgress = MANUALLY_PROGRESSABLE_FROM.includes(order.status)

  return (
    <div className="space-y-4">
      <Link to="/dashboard/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-mono text-lg font-semibold">Order {order.id.slice(-8)}</h1>
          <p className="text-sm text-muted-foreground">Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <Badge variant={orderStatusVariant(order.status)} className="text-sm">
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × KSh {item.priceAtPurchaseKes.toLocaleString()}
                  </p>
                </div>
                <p className="font-medium">KSh {(item.quantity * item.priceAtPurchaseKes).toLocaleString()}</p>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <p className="font-semibold">Total</p>
              <p className="font-semibold">KSh {order.totalKes.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.shippingName}</p>
              <p className="text-muted-foreground">{order.shippingPhone}</p>
              <p className="text-muted-foreground">{order.shippingAddress}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.payments.length === 0 && <p className="text-muted-foreground">No payment attempts yet.</p>}
              {order.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span>{p.method === 'CARD' ? 'Paystack' : 'M-Pesa'}</span>
                  <Badge variant={p.status === 'SUCCESS' ? 'default' : p.status === 'FAILED' ? 'destructive' : 'outline'}>
                    {p.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {order.status === 'CANCELLED' && order.cancellationReason && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cancellation reason</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{order.cancellationReason}</CardContent>
            </Card>
          )}

          {canUpdateStatus && canProgress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Update status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as OrderStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {NEXT_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ORDER_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="w-full" disabled={!nextStatus || isUpdating} onClick={handleUpdateStatus}>
                  {isUpdating ? 'Updating…' : 'Update status'}
                </Button>
              </CardContent>
            </Card>
          )}

          {canUpdateStatus && CANCELLABLE_FROM.includes(order.status) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cancel order</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="w-full" onClick={() => setCancelDialogOpen(true)}>
                  Cancel this order
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CancelOrderDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        orderId={order.id}
        isSubmitting={isCancelling}
        onConfirm={handleCancel}
      />
    </div>
  )
}
