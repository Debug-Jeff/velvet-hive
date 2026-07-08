import { MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Product } from '@/types/product'

interface ProductGridCardProps {
  product: Product
  onEdit: () => void
  onRemove: () => void
}

export default function ProductGridCard({ product, onEdit, onRemove }: ProductGridCardProps) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt=""
          className="size-full object-cover"
          onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
        />
        {product.stockQuantity <= product.reorderThreshold && (
          <Badge variant="destructive" className="absolute left-2 top-2">
            Low stock
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon-sm" className="absolute right-2 top-2 shadow">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onRemove}>
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CardContent className="space-y-1 pt-3">
        <Badge variant="outline" className="mb-1 font-normal">
          {product.category}
        </Badge>
        <p className="line-clamp-1 text-sm font-medium">{product.name}</p>
        <p className="text-xs text-muted-foreground">{product.sku}</p>
      </CardContent>
      <CardFooter className="justify-between pb-3 text-sm">
        <span className="font-semibold text-primary">KSh {product.priceKes.toLocaleString()}</span>
        <span className={product.stockQuantity <= product.reorderThreshold ? 'font-medium text-destructive' : 'text-muted-foreground'}>
          {product.stockQuantity} in stock
        </span>
      </CardFooter>
    </Card>
  )
}
