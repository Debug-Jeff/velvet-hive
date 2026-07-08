import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, XCircle, Clock, CreditCard, Smartphone } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCurrency } from '@/context/CurrencyContext'
import { usePaymentModal } from '@/context/PaymentModalContext'
import { ApiError } from '@/api/client'
import * as ordersApi from '@/api/orders.api'
import * as paymentsApi from '@/api/payments.api'
import type { Order } from '@/types/order'

const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 40 // ~2 minutes before we stop auto-polling and let the user check manually

export default function PaymentModal() {
  const { orderId, step, reference, isOpen, openForOrder, close } = usePaymentModal()
  const navigate = useNavigate()
  const { format } = useCurrency()

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoadingOrder, setIsLoadingOrder] = useState(false)
  const [phone, setPhone] = useState('')
  const [isPayingCard, setIsPayingCard] = useState(false)
  const [isPayingMpesa, setIsPayingMpesa] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [isCheckingManually, setIsCheckingManually] = useState(false)
  const attemptedVerify = useRef(false)
  const attemptCount = useRef(0)

  // Fetch the order fresh every time the modal is opened for a (possibly new) order.
  useEffect(() => {
    if (!orderId) return
    setIsLoadingOrder(true)
    setTimedOut(false)
    attemptCount.current = 0
    attemptedVerify.current = false
    ordersApi
      .getOrder(orderId)
      .then((o) => {
        setOrder(o)
        setPhone(o.shippingPhone)
      })
      .catch(() => close())
      .finally(() => setIsLoadingOrder(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const checkOnce = useCallback(async () => {
    if (!orderId) throw new Error('No order')
    if (reference && !attemptedVerify.current) {
      // If we arrived via a Paystack redirect, nudge the webhook along with an
      // explicit verify call in case it hasn't landed yet.
      attemptedVerify.current = true
      paymentsApi.verifyPaystack(reference).catch(() => {})
    }
    const latest = await ordersApi.getOrder(orderId)
    setOrder(latest)
    return latest
  }, [orderId, reference])

  useEffect(() => {
    if (!isOpen || step !== 'confirming' || !orderId) return
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout>

    async function poll() {
      attemptCount.current += 1
      try {
        const latest = await checkOnce()
        if (cancelled) return
        if (latest.status === 'PENDING_PAYMENT') {
          if (attemptCount.current >= MAX_POLL_ATTEMPTS) setTimedOut(true)
          else timeoutId = setTimeout(poll, POLL_INTERVAL_MS)
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
  }, [isOpen, step, orderId, checkOnce])

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

  async function payWithCard() {
    if (!orderId) return
    setIsPayingCard(true)
    try {
      const { authorizationUrl } = await paymentsApi.initializePaystack(orderId)
      // Real full-page redirect to Paystack's hosted checkout - this is the
      // one part of the flow that fundamentally can't stay in a modal, since
      // Paystack itself owns the card-entry page. The modal picks back up in
      // the "confirming" step once Paystack redirects back via callback_url.
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
      openForOrder(orderId, 'confirming')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not start M-Pesa payment')
    } finally {
      setIsPayingMpesa(false)
    }
  }

  function handleViewOrder() {
    if (!order) return
    close()
    navigate(`/orders/${order.id}`)
  }

  function handleTryDifferentMethod() {
    if (!orderId) return
    openForOrder(orderId, 'choose')
    setTimedOut(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        {step === 'choose' && (
          <>
            <DialogHeader>
              <DialogTitle>Choose a payment method</DialogTitle>
              {order && (
                <DialogDescription>
                  Amount due: <span className="font-semibold text-foreground">{format(order.totalKes)}</span>
                </DialogDescription>
              )}
            </DialogHeader>

            {isLoadingOrder || !order ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={payWithCard}>
                  <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <CreditCard className="size-6 text-primary" />
                    <div>
                      <CardTitle className="text-base">Pay with card</CardTitle>
                      <CardDescription>Visa, Mastercard via Paystack</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      disabled={isPayingCard}
                      onClick={(e) => {
                        e.stopPropagation()
                        payWithCard()
                      }}
                    >
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
            )}
          </>
        )}

        {step === 'confirming' && (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Confirming payment</DialogTitle>
              <DialogDescription>Waiting for payment confirmation</DialogDescription>
            </DialogHeader>

            {!order ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading order…</p>
              </div>
            ) : order.status === 'PAID' ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="size-12 text-emerald-600" />
                <h2 className="text-xl font-semibold">Payment successful!</h2>
                <p className="text-muted-foreground">Your order has been confirmed.</p>
                <Button onClick={handleViewOrder}>View order</Button>
              </div>
            ) : order.status === 'PENDING_PAYMENT' && timedOut ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <Clock className="size-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Still waiting on payment</h2>
                <p className="max-w-sm text-muted-foreground">
                  This is taking longer than expected. If you completed the payment on your phone, tap below to check again.
                </p>
                <div className="flex w-full flex-col gap-2">
                  <Button className="w-full" disabled={isCheckingManually} onClick={handleCheckManually}>
                    {isCheckingManually ? 'Checking…' : 'Check status again'}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleTryDifferentMethod}>
                    Try a different payment method
                  </Button>
                </div>
              </div>
            ) : order.status === 'PENDING_PAYMENT' ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Loader2 className="size-10 animate-spin text-primary" />
                <h2 className="text-xl font-semibold">Waiting for payment confirmation…</h2>
                <p className="max-w-sm text-muted-foreground">
                  This can take a few moments. If you're paying via M-Pesa, check your phone for the STK prompt.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <XCircle className="size-12 text-destructive" />
                <h2 className="text-xl font-semibold">Payment failed</h2>
                <p className="text-muted-foreground">Something went wrong with your payment. You can try again.</p>
                <Button className="w-full" onClick={handleTryDifferentMethod}>
                  Try again
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
