import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/context/CurrencyContext'
import { useCart } from '@/context/CartContext'
import type { Product } from '@/types/product'

interface ProductDetailProps {
  product: Product | null
  onClose: () => void
}

export default function ProductDetail({ product, onClose }: ProductDetailProps) {
  const { format } = useCurrency()
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            <Badge variant="outline">{product.category}</Badge>
          </DialogDescription>
        </DialogHeader>

        <img src={product.imageUrl} alt={product.name} className="aspect-video w-full rounded-md object-cover" />

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
