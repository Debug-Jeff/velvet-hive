import { useState } from 'react'
import { X } from 'lucide-react'
import { Product } from '../App'
import { useCurrency } from '../context/CurrencyContext'
import './ProductDetail.css'

interface Props {
  product: Product
  onClose: () => void
  onAddToCart: (product: Product, quantity: number) => void
}

const FALLBACK_DESCRIPTION =
  'A carefully chosen piece for your everyday - quality materials, considered design, built to last.'

function ProductDetail({ product, onClose, onAddToCart }: Props) {
  const [quantity, setQuantity] = useState(1)
  const { format } = useCurrency()

  const handleAdd = () => {
    onAddToCart(product, quantity)
    onClose()
  }

  return (
    <>
      <div className="detail-overlay" onClick={onClose} />

      <div className="detail-modal">
        <button className="icon-btn detail-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="detail-image">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="detail-body">
          <span className="badge">{product.category}</span>
          <h2 className="detail-name">{product.name}</h2>
          <p className="detail-price">{format(product.price)}</p>
          <p className="detail-description">
            {product.description || FALLBACK_DESCRIPTION}
          </p>

          <div className="detail-qty">
            <span className="detail-qty-label">Quantity</span>
            <div className="qty-stepper">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)}>+</button>
            </div>
          </div>

          <button className="btn btn-primary btn-lg btn-full" onClick={handleAdd}>
            Add to Cart — {format(product.price * quantity)}
          </button>
        </div>
      </div>
    </>
  )
}

export default ProductDetail