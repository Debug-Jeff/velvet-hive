import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ProductList from './components/ProductList'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import ProductDetail from './components/ProductDetail'
import AdminPage from './components/admin/AdminPage'
import { CATEGORIES } from './constants'

export { CATEGORIES }

export interface Product {
  id: number
  name: string
  price: number
  category: string
  image: string
  description?: string
}

export interface CartItem extends Product {
  quantity: number
}

function App() {
  if (window.location.pathname === '/admin') return <AdminPage />

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Fetch products from the API on mount
  useEffect(() => {
    fetch('/api/products')
      .then(res => {
        if (!res.ok) throw new Error('Could not reach the server')
        return res.json()
      })
      .then(data => setProducts(data))
      .catch(err => setFetchError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (product: Product, qty: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
        )
      }
      return [...prev, { ...product, quantity: qty }]
    })
  }

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  // Below quantity 1, treat it the same as removing the item
  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id)
      return
    }
    setCart(prev => prev.map(item => (item.id === id ? { ...item, quantity } : item)))
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
      <Navbar totalItems={totalItems} onCartClick={() => setCartOpen(true)} />

      <Hero
        search={search}
        onSearchChange={setSearch}
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <main className="main">
        {loading && <p className="status-msg">Loading products...</p>}
        {fetchError && (
          <p className="status-msg status-error">
            Error: {fetchError}. Make sure the server is running.
          </p>
        )}
        {!loading && !fetchError && (
          <ProductList
            products={filteredProducts}
            onAddToCart={addToCart}
            onProductClick={setSelectedProduct}
          />
        )}
      </main>

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      {cartOpen && (
        <Cart
          cartItems={cart}
          onRemoveFromCart={removeFromCart}
          onUpdateQuantity={updateQuantity}
          onClose={() => setCartOpen(false)}
          onCheckout={() => {
            setCartOpen(false)
            setCheckoutOpen(true)
          }}
        />
      )}

      {checkoutOpen && (
        <Checkout
          cartItems={cart}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={() => {
            setCart([])
            setCheckoutOpen(false)
          }}
        />
      )}
    </>
  )
}

export default App