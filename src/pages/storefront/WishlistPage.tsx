import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import ProductCard from '@/components/storefront/ProductCard'
import ProductDetail from '@/components/storefront/ProductDetail'
import * as favoritesApi from '@/api/favorites.api'
import { ApiError } from '@/api/client'
import { useFavorites } from '@/context/FavoritesContext'
import type { Product } from '@/types/product'

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<Product | null>(null)
  const { favoriteIds } = useFavorites()

  useEffect(() => {
    favoritesApi
      .listFavorites()
      .then(setProducts)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'Failed to load your wishlist'))
      .finally(() => setIsLoading(false))
  }, [])

  // Keep the visible list in sync with un-favoriting a product from this same
  // page (favoriteIds updates immediately via the optimistic toggle; the
  // fetched product list only reflects what loaded on mount otherwise).
  const visibleProducts = products.filter((p) => favoriteIds.has(p.id))

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Your wishlist</h1>
        <p className="text-sm text-muted-foreground">Products you've saved for later.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-lg" />
          ))}
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Heart className="size-8" />
          <p>Nothing saved yet. Tap the heart on any product to add it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} onClick={() => setSelected(product)} />
          ))}
        </div>
      )}

      <ProductDetail product={selected} onClose={() => setSelected(null)} />
    </main>
  )
}
