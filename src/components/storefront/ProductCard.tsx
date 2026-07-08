import type { MouseEvent } from 'react'
import { Plus, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/context/CurrencyContext'
import { useCart } from '@/context/CartContext'
import { useFavorites } from '@/context/FavoritesContext'
import { useAuth } from '@/context/AuthContext'
import { optimizedImageUrl } from '@/lib/cloudinaryImage'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'

interface ProductCardProps {
  product: Product
  onClick: () => void
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const { format } = useCurrency()
  const { addToCart } = useCart()
  const { user } = useAuth()
  const { isFavorited, toggleFavorite } = useFavorites()
  const isOutOfStock = product.stockQuantity <= 0
  const favorited = isFavorited(product.id)

  function handleAdd(e: MouseEvent) {
    e.stopPropagation()
    addToCart(product)
    toast.success(`Added ${product.name} to cart`)
  }

  function handleToggleFavorite(e: MouseEvent) {
    e.stopPropagation()
    if (!user) {
      toast.error('Sign in to save favorites')
      return
    }
    toggleFavorite(product.id)
  }

  return (
    <Card
      className="group cursor-pointer overflow-hidden gap-0 border-border/60 py-0 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      onClick={onClick}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <img
          src={optimizedImageUrl(product.imageUrl)}
          alt={product.name}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          className="absolute right-2 top-2 rounded-full shadow-sm"
          onClick={handleToggleFavorite}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={cn('size-4', favorited && 'fill-destructive text-destructive')} />
        </Button>
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <Badge variant="destructive">Out of stock</Badge>
          </div>
        )}
      </div>
      <CardContent className="space-y-1 pt-4">
        <Badge variant="outline" className="mb-1 font-normal">
          {product.category}
        </Badge>
        <p className="line-clamp-1 font-medium">{product.name}</p>
        <p className="text-sm font-semibold text-primary">{format(product.priceKes)}</p>
      </CardContent>
      <CardFooter className="pb-4">
        <Button size="sm" className="w-full" disabled={isOutOfStock} onClick={handleAdd}>
          <Plus /> Add to cart
        </Button>
      </CardFooter>
    </Card>
  )
}
