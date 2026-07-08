import { useEffect, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrency } from '@/context/CurrencyContext'
import { useCart } from '@/context/CartContext'
import { ORDER_STATUS_LABELS, orderStatusVariant } from '@/lib/orderStatus'
import * as ordersApi from '@/api/orders.api'
import { ApiError } from '@/api/client'
import type { Order } from '@/types/order'

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { format } = useCurrency()
  const { addToCart } = useCart()
  const navigate = useNavigate()

  function handleBuyAgain(e: MouseEvent, order: Order) {
    e.preventDefault()
    e.stopPropagation()
    for (const item of order.items) {
      addToCart(item.product, item.quantity)
    }
    toast.success('Items added to your cart')
    navigate('/checkout')
  }

  useEffect(() => {
    ordersApi
      .listOrders()
      .then(setOrders)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Failed to load orders'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">My orders</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No orders yet. <Link to="/" className="text-primary hover:underline">Start shopping</Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-mono text-sm text-muted-foreground">#{order.id.slice(-8)}</p>
                    <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">{format(order.totalKes)}</p>
                      <Badge variant={orderStatusVariant(order.status)}>{ORDER_STATUS_LABELS[order.status]}</Badge>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={(e) => handleBuyAgain(e, order)} aria-label="Buy again">
                      <RotateCcw className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
