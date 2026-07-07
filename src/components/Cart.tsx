import { CartItem } from '../App'
import { X } from 'lucide-react'
import { useCurrency } from '../context/CurrencyContext'
import './Cart.css'

interface Props {
  cartItems: CartItem[]
  onRemoveFromCart: (id: number) => void
  onUpdateQuantity: (id: number, quantity: number) => void
  onClose: () => void
  onCheckout: () => void
}

function Cart({ cartItems, onRemoveFromCart, onUpdateQuantity, onClose, onCheckout }: Props) {
  const { format } = useCurrency()
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalCost = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />

      <div className="cart-sidebar">
        <div className="cart-header">
          <h2>Shopping Cart</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="cart-body">
          {cartItems.length === 0 ? (
            <p className="cart-empty">Your cart is empty.</p>
          ) : (
            <ul className="cart-list">
              {cartItems.map(item => (
                <li key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} />
                  <div className="cart-item-info">
                    <p className="cart-item-name">{item.name}</p>
                    <div className="qty-stepper">
                      <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <p className="cart-item-price">{format(item.price * item.quantity)}</p>
                  </div>
                  <button className="icon-btn" onClick={() => onRemoveFromCart(item.id)}>
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-totals">
              <p><span>Items</span><span>{totalItems}</span></p>
            </div>
            <div className="cart-total-final">
              <span>Total</span>
              <span>{format(totalCost)}</span>
            </div>
            <button className="btn btn-primary btn-lg btn-full" onClick={onCheckout}>
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default Cart