import { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { usePaymentModal } from '@/context/PaymentModalContext'

// Paystack's callback_url points here after a card payment completes, so
// this route has to stay real - but the actual "confirming" UI (including
// the polling logic) now lives in PaymentModal. This page just opens that
// modal in the confirming step (passing along Paystack's ?reference= if
// present) and redirects to '/'.
export default function PaymentPendingPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [searchParams] = useSearchParams()
  const reference = searchParams.get('reference')
  const navigate = useNavigate()
  const { openForOrder } = usePaymentModal()

  useEffect(() => {
    if (orderId) openForOrder(orderId, 'confirming', reference ?? undefined)
    navigate('/', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, reference])

  return null
}
