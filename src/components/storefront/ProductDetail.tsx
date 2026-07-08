import { useState } from 'react'
import { Minus, Plus, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/context/CurrencyContext'
import { useCart } from '@/context/CartContext'
import { useFavorites } from '@/context/FavoritesContext'
import { useAuth } from '@/context/AuthContext'
import { optimizedImageUrl } from '@/lib/cloudinaryImage'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'

interface ProductDetailProps {
  product: Product | null
  onClose: () => void
}

export default function ProductDetail({ product, onClose }: ProductDetailProps) {
  const { format } = useCurrency()
  const { addToCart } = useCart()
  const { user } = useAuth()
  const { isFavorited, toggleFavorite } = useFavorites()
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const favorited = isFavorited(product.id)

  function handleToggleFavorite() {
    if (!user) {
      toast.error('Sign in to save favorites')
      return
    }
    toggleFavorite(product!.id)
  }

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>{product.name}</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleToggleFavorite}
              aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={cn('size-4', favorited && 'fill-destructive text-destructive')} />
            </Button>
          </div>
          <DialogDescription>
            <Badge variant="outline">{product.category}</Badge>
          </DialogDescription>
        </DialogHeader>

        <img src={optimizedImageUrl(product.imageUrl)} alt={product.name} className="aspect-video w-full rounded-md object-cover" />

        <p className="text-sm text-muted-foreground">
          {product.description || 'A great addition to your basket.'}
        </p>

        <div className="flex items-center justify-between">
          <p className="text-xl font-semibold text-primary">{format(product.priceKes)}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
              <Minus />
            </Button>
            <span className="w-6 text-center">{quantity}</span>
            <Button variant="outline" size="icon-sm" onClick={() => setQuantity((q) => q + 1)}>
              <Plus />
            </Button>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={() => {
            addToCart(product, quantity)
            setQuantity(1)
            onClose()
          }}
        >
          Add {quantity} to cart · {format(product.priceKes * quantity)}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
