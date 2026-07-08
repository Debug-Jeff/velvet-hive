import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CreditCard, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrency } from '@/context/CurrencyContext'
import { ApiError } from '@/api/client'
import * as ordersApi from '@/api/orders.api'
import * as paymentsApi from '@/api/payments.api'
import type { Order } from '@/types/order'

export default function PaymentMethodPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { format } = useCurrency()

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [phone, setPhone] = useState('')
  const [isPayingCard, setIsPayingCard] = useState(false)
  const [isPayingMpesa, setIsPayingMpesa] = useState(false)

  useEffect(() => {
    if (!orderId) return
    ordersApi
      .getOrder(orderId)
      .then((o) => {
        setOrder(o)
        setPhone(o.shippingPhone)
      })
      .catch(() => navigate('/', { replace: true }))
      .finally(() => setIsLoading(false))
  }, [orderId, navigate])

  async function payWithCard() {
    if (!orderId) return
    setIsPayingCard(true)
    try {
      const { authorizationUrl } = await paymentsApi.initializePaystack(orderId)
      window.location.href = authorizationUrl
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not start card payment')
      setIsPayingCard(false)
    }
  }

  async function payWithMpesa() {
    if (!orderId) return
    setIsPayingMpesa(true)
    try {
      await paymentsApi.initiateMpesaStkPush({ orderId, phone })
      toast.success('Check your phone to complete the M-Pesa payment')
      navigate(`/checkout/${orderId}/confirming`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not start M-Pesa payment')
      setIsPayingMpesa(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-10">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Amount due</p>
        <p className="text-3xl font-bold text-primary">{format(order.totalKes)}</p>
      </div>

      <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={payWithCard}>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <CreditCard className="size-6 text-primary" />
          <div>
            <CardTitle className="text-base">Pay with card</CardTitle>
            <CardDescription>Visa, Mastercard via Paystack</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button className="w-full" disabled={isPayingCard} onClick={(e) => { e.stopPropagation(); payWithCard() }}>
            {isPayingCard ? 'Redirecting…' : 'Pay with card'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <Smartphone className="size-6 text-primary" />
          <div>
            <CardTitle className="text-base">Pay with M-Pesa</CardTitle>
            <CardDescription>We'll send an STK push to your phone</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" />
          <Button variant="outline" className="w-full" disabled={isPayingMpesa} onClick={payWithMpesa}>
            {isPayingMpesa ? 'Sending prompt…' : 'Send STK push'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
