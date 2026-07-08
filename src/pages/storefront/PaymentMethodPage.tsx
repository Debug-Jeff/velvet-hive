import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePaymentModal } from '@/context/PaymentModalContext'

// This route still exists as a real URL (direct links/refreshes need
// somewhere to land), but the actual UI now lives in PaymentModal, mounted
// once at the StorefrontLayout level so it can be reached from anywhere.
// This page just opens that modal in the right step and redirects to '/'.
export default function PaymentMethodPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { openForOrder } = usePaymentModal()

  useEffect(() => {
    if (orderId) openForOrder(orderId, 'choose')
    navigate('/', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  return null
}
