import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import FormSheet from '@/components/dashboard/FormSheet'
import * as inventoryApi from '@/api/inventory.api'
import { ApiError } from '@/api/client'
import type { Product } from '@/types/product'
import type { InventoryMovementType } from '@/types/inventory'

const schema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.coerce.number().int().nonnegative('Must be 0 or more'),
  reason: z.string().min(1, 'Required'),
})
type Values = z.infer<typeof schema>

const TYPE_LABELS: Record<InventoryMovementType, string> = {
  IN: 'Stock in (delivery received)',
  OUT: 'Stock out (damage, loss, etc.)',
  ADJUSTMENT: 'Adjustment (physical count correction)',
}

interface InventoryMovementFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSuccess: () => void
}

export default function InventoryMovementFormSheet({ open, onOpenChange, product, onSuccess }: InventoryMovementFormSheetProps) {
  const form = useForm<Values>({
    // z.coerce.number() gives a different inferred input vs output type, which
    // trips up Resolver's generic - the validation itself is correct at runtime.
    resolver: zodResolver(schema) as never,
    defaultValues: { type: 'IN', quantity: 0, reason: '' },
  })

  const type = form.watch('type')

  async function onSubmit(values: Values) {
    if (!product) return
    try {
      await inventoryApi.createInventoryMovement({ productId: product.id, ...values })
      toast.success('Stock movement recorded')
      form.reset({ type: 'IN', quantity: 0, reason: '' })
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to record movement')
    }
  }

  if (!product) return null

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Record stock movement"
      description={`${product.name} - currently ${product.stockQuantity} in stock`}
      onSubmit={form.handleSubmit(onSubmit)}
      isSubmitting={form.formState.isSubmitting}
      submitLabel="Record movement"
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Movement type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(['IN', 'OUT', 'ADJUSTMENT'] as const).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{type === 'ADJUSTMENT' ? 'New stock count' : 'Quantity'}</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
              </FormControl>
              <FormDescription>
                {type === 'ADJUSTMENT'
                  ? 'Enter the actual count from your physical stock take - this replaces the current total.'
                  : type === 'IN'
                    ? 'Units being added to stock.'
                    : 'Units being removed from stock.'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="e.g. Delivery from supplier XYZ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </FormSheet>
  )
}
