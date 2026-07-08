import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, RotateCcw, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import CancelOrderDialog from '@/components/dashboard/CancelOrderDialog'
import { useCurrency } from '@/context/CurrencyContext'
import { useCart } from '@/context/CartContext'
import { ORDER_STATUS_LABELS, orderStatusVariant } from '@/lib/orderStatus'
import { optimizedImageUrl } from '@/lib/cloudinaryImage'
import * as ordersApi from '@/api/orders.api'
import { ApiError } from '@/api/client'
import type { Order } from '@/types/order'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { format } = useCurrency()
  const { addToCart } = useCart()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    if (!id) return
    ordersApi
      .getOrder(id)
      .then(setOrder)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Failed to load order'))
      .finally(() => setIsLoading(false))
  }, [id])

  async function handleCancel(reason: string) {
    if (!order) return
    setIsCancelling(true)
    try {
      const updated = await ordersApi.cancelOrder(order.id, reason)
      setOrder(updated)
      setCancelOpen(false)
      toast.success('Order cancelled')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to cancel order')
    } finally {
      setIsCancelling(false)
    }
  }

  function handleBuyAgain() {
    if (!order) return
    for (const item of order.items) {
      addToCart(item.product, item.quantity)
    }
    toast.success('Items added to your cart')
    navigate('/checkout')
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-60 w-full" />
      </div>
    )
  }

  if (!order) return null

  const canCancel = order.status === 'PENDING_PAYMENT'

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-10">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to my orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-lg font-semibold">Order #{order.id.slice(-8)}</h1>
          <p className="text-sm text-muted-foreground">Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <Badge variant={orderStatusVariant(order.status)} className="text-sm">
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
              <img src={optimizedImageUrl(item.product.imageUrl)} alt="" className="size-12 rounded-md object-cover" />
              <div className="flex-1">
                <p className="font-medium">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} × {format(item.priceAtPurchaseKes)}
                </p>
              </div>
              <p className="font-medium">{format(item.quantity * item.priceAtPurchaseKes)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 font-semibold">
            <span>Total</span>
            <span>{format(order.totalKes)}</span>
          </div>
        </CardContent>
      </Card>

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

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleBuyAgain}>
          <RotateCcw /> Buy again
        </Button>
        {canCancel && (
          <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setCancelOpen(true)}>
            <X /> Cancel order
          </Button>
        )}
      </div>

      <CancelOrderDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        orderId={order.id}
        isSubmitting={isCancelling}
        onConfirm={handleCancel}
      />
    </div>
  )
}
