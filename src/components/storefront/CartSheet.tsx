import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useCart } from '@/context/CartContext'
import { useCurrency } from '@/context/CurrencyContext'

export default function CartSheet() {
  const { items, isOpen, close, totalKes, removeFromCart, updateQuantity } = useCart()
  const { format } = useCurrency()
  const navigate = useNavigate()

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
            <ShoppingBag className="size-10" />
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-3 border-b pb-4 last:border-0">
                <img src={product.imageUrl} alt={product.name} className="size-16 shrink-0 rounded-md object-cover" />
                <div className="flex-1">
                  <p className="font-medium leading-tight">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{format(product.priceKes)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button variant="outline" size="icon-xs" onClick={() => updateQuantity(product.id, quantity - 1)}>
                      <Minus />
                    </Button>
                    <span className="w-6 text-center text-sm">{quantity}</span>
                    <Button variant="outline" size="icon-xs" onClick={() => updateQuantity(product.id, quantity + 1)}>
                      <Plus />
                    </Button>
                    <Button variant="ghost" size="icon-xs" className="ml-auto text-destructive" onClick={() => removeFromCart(product.id)}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <SheetFooter className="gap-2">
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>{format(totalKes)}</span>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                close()
                navigate('/checkout')
              }}
            >
              Checkout
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
