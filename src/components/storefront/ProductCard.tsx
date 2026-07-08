import type { MouseEvent } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/context/CurrencyContext'
import { useCart } from '@/context/CartContext'
import type { Product } from '@/types/product'

interface ProductCardProps {
  product: Product
  onClick: () => void
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const { format } = useCurrency()
  const { addToCart } = useCart()
  const isOutOfStock = product.stockQuantity <= 0

  function handleAdd(e: MouseEvent) {
    e.stopPropagation()
    addToCart(product)
    toast.success(`Added ${product.name} to cart`)
  }

  return (
    <Card
      className="group cursor-pointer overflow-hidden gap-0 border-border/60 py-0 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      onClick={onClick}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
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
