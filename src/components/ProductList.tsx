import { Product } from '../App'
import ProductCard from './ProductCard'
import './ProductList.css'

interface Props {
  products: Product[]
  onAddToCart: (product: Product) => void
  onProductClick: (product: Product) => void
}

function ProductList({ products, onAddToCart, onProductClick }: Props) {
  return (
    <div className="product-grid">
      {products.length === 0 ? (
        <p className="no-products">No products found.</p>
      ) : (
        products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onProductClick={onProductClick}
          />
        ))
      )}
    </div>
  )
}

export default ProductList