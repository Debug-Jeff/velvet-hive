import { ShoppingCart } from 'lucide-react'
import { useCurrency } from '../context/CurrencyContext'
import './Navbar.css'

interface NavbarProps {
  totalItems: number
  onCartClick: () => void
}

function Navbar({ totalItems, onCartClick }: NavbarProps) {
  const { currency, toggle } = useCurrency()

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-row">
          <button className="currency-toggle" onClick={toggle} title="Switch currency">
            {currency === 'KSH' ? 'KSh' : 'USD'}
          </button>

          <span className="logo">Velvet Hive</span>

          <button className="cart-btn" onClick={onCartClick}>
            <ShoppingCart size={20} />
            <span className="cart-btn-label">Cart</span>
            {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
