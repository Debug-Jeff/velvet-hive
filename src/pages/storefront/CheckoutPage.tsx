import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useCart } from '@/context/CartContext'
import { useCurrency } from '@/context/CurrencyContext'
import { ApiError } from '@/api/client'
import * as ordersApi from '@/api/orders.api'

const schema = z.object({
  shippingName: z.string().min(1, 'Required'),
  shippingPhone: z.string().min(9, 'Enter a valid phone number'),
  shippingAddress: z.string().min(1, 'Required'),
})
type Values = z.infer<typeof schema>

export default function CheckoutPage() {
  const { items, totalKes, clear } = useCart()
  const { format } = useCurrency()
  const navigate = useNavigate()

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { shippingName: '', shippingPhone: '', shippingAddress: '' },
  })

  useEffect(() => {
    if (items.length === 0) navigate('/', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(values: Values) {
    try {
      const order = await ordersApi.createOrder({
        ...values,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      })
      clear()
      navigate(`/checkout/${order.id}/pay`)
    } catch (err) {
      form.setError('root', { message: err instanceof ApiError ? err.message : 'Could not place order' })
    }
  }

  if (items.length === 0) return null

  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-10 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Shipping details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="shippingName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input autoFocus {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shippingPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl>
                      <Input placeholder="07XXXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shippingAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
              )}

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Placing order…' : 'Continue to payment'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex justify-between text-sm">
              <span>
                {product.name} × {quantity}
              </span>
              <span>{format(product.priceKes * quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-3 font-semibold">
            <span>Total</span>
            <span>{format(totalKes)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
