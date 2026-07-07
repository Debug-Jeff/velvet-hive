import { Product } from '../App'
import { useCurrency } from '../context/CurrencyContext'
import './ProductCard.css'

interface Props {
  product: Product
  onAddToCart: (product: Product) => void
  onProductClick: (product: Product) => void
}

function ProductCard({ product, onAddToCart, onProductClick }: Props) {
  const { format } = useCurrency()
  return (
    <div className="product-card" onClick={() => onProductClick(product)}>
      <img src={product.image} alt={product.name} />
      <div className="product-card-body">
        <span className="badge">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">{format(product.price)}</p>
        <button
          className="btn btn-primary btn-sm btn-full"
          style={{ marginTop: 'auto' }}
          onClick={e => {
            e.stopPropagation()
            onAddToCart(product)
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  )
}

export default ProductCard