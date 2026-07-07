import { useState } from 'react'
import { CartItem } from '../App'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { useCurrency } from '../context/CurrencyContext'
import './Checkout.css'

interface Props {
  cartItems: CartItem[]
  onClose: () => void
  onSuccess: () => void
}

function Checkout({ cartItems, onClose, onSuccess }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', address: '' })

  const { format } = useCurrency()
  const totalCost = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setApiError('')

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          address: form.address,
          items: cartItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to place order')
      }

      setSubmitted(true)
      setTimeout(onSuccess, 2500)
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div className="modal-overlay">
      <div className="modal">

        <div className="modal-header">
          <h2>Checkout</h2>
          {!submitted && (
            <button className="icon-btn" onClick={onClose}><X size={20} /></button>
          )}
        </div>

        {submitted ? (
          <div className="checkout-success">
            <CheckCircle className="check-icon" size={60} />
            <h3>Order Placed!</h3>
            <p>Thank you! A confirmation is on its way.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-body">
            <div className="order-summary">
              {cartItems.map(item => (
                <div key={item.id} className="order-row">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{format(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="order-total">
                <span>Total</span>
                <span>{format(totalCost)}</span>
              </div>
            </div>

            {apiError && (
              <div className="checkout-error">
                <AlertCircle size={16} />
                <span>{apiError}</span>
              </div>
            )}

            <div className="form-group">
              <label>Full Name</label>
              <input className="input" required placeholder="Jane Doe" value={form.name} onChange={update('name')} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="input" type="email" required placeholder="jane@example.com" value={form.email} onChange={update('email')} />
            </div>
            <div className="form-group">
              <label>Shipping Address</label>
              <input className="input" required placeholder="123 Main St, City" value={form.address} onChange={update('address')} />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={submitting}
            >
              {submitting ? 'Placing order...' : `Place Order — ${format(totalCost)}`}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}

export default Checkout
