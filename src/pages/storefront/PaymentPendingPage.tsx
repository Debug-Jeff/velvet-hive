import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import * as ordersApi from '@/api/orders.api'
import * as paymentsApi from '@/api/payments.api'
import type { Order } from '@/types/order'

const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 40 // ~2 minutes before we stop auto-polling and let the user check manually

export default function PaymentPendingPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [searchParams] = useSearchParams()
  const reference = searchParams.get('reference')
  const navigate = useNavigate()

  const [order, setOrder] = useState<Order | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const [isCheckingManually, setIsCheckingManually] = useState(false)
  const attemptedVerify = useRef(false)
  const attemptCount = useRef(0)

  const checkOnce = useCallback(async () => {
    if (reference && !attemptedVerify.current) {
      // If we arrived via a Paystack redirect, nudge the webhook along with an
      // explicit verify call in case it hasn't landed yet.
      attemptedVerify.current = true
      paymentsApi.verifyPaystack(reference).catch(() => {})
    }
    const latest = await ordersApi.getOrder(orderId!)
    setOrder(latest)
    return latest
  }, [orderId, reference])

  useEffect(() => {
    if (!orderId) return
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout>

    async function poll() {
      attemptCount.current += 1
      try {
        const latest = await checkOnce()
        if (cancelled) return
        if (latest.status === 'PENDING_PAYMENT') {
          if (attemptCount.current >= MAX_POLL_ATTEMPTS) {
            setTimedOut(true)
          } else {
            timeoutId = setTimeout(poll, POLL_INTERVAL_MS)
          }
        }
      } catch {
        if (!cancelled && attemptCount.current < MAX_POLL_ATTEMPTS) {
          timeoutId = setTimeout(poll, POLL_INTERVAL_MS)
        }
      }
    }

    timeoutId = setTimeout(poll, 0)
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [orderId, checkOnce])

  async function handleCheckManually() {
    setIsCheckingManually(true)
    try {
      const latest = await checkOnce()
      if (latest.status === 'PENDING_PAYMENT') {
        attemptCount.current = 0
        setTimedOut(false)
      }
    } finally {
      setIsCheckingManually(false)
    }
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading order…</p>
      </div>
    )
  }

  if (order.status === 'PAID') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <CheckCircle2 className="size-12 text-emerald-600" />
        <h1 className="text-xl font-semibold">Payment successful!</h1>
        <p className="text-muted-foreground">Your order has been confirmed.</p>
        <Button onClick={() => navigate(`/orders/${order.id}`)}>View order</Button>
      </div>
    )
  }

  if (order.status === 'PENDING_PAYMENT' && timedOut) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <Clock className="size-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Still waiting on payment</h1>
        <p className="max-w-sm text-muted-foreground">
          This is taking longer than expected. If you completed the payment on your phone, tap below to check again.
        </p>
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col gap-2 pt-4">
            <Button className="w-full" disabled={isCheckingManually} onClick={handleCheckManually}>
              {isCheckingManually ? 'Checking…' : 'Check status again'}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate(`/checkout/${order.id}/pay`)}>
              Try a different payment method
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (order.status === 'PENDING_PAYMENT') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <Loader2 className="size-10 animate-spin text-primary" />
        <h1 className="text-xl font-semibold">Waiting for payment confirmation…</h1>
        <p className="max-w-sm text-muted-foreground">
          This can take a few moments. If you're paying via M-Pesa, check your phone for the STK prompt.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <XCircle className="size-12 text-destructive" />
      <h1 className="text-xl font-semibold">Payment failed</h1>
      <p className="text-muted-foreground">Something went wrong with your payment. You can try again from your order.</p>
      <Card className="w-full max-w-sm">
        <CardContent className="pt-4">
          <Button className="w-full" onClick={() => navigate(`/checkout/${order.id}/pay`)}>
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
