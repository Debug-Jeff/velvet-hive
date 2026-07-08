import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import FormSheet from '@/components/dashboard/FormSheet'
import * as productsApi from '@/api/products.api'
import { ApiError } from '@/api/client'
import { CATEGORIES } from '@/constants/categories'
import type { Product } from '@/types/product'

const CATEGORY_OPTIONS = CATEGORIES.filter((c) => c !== 'All')

const createSchema = z.object({
  sku: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  category: z.enum(CATEGORY_OPTIONS as [string, ...string[]]),
  imageUrl: z.string().min(1, 'Required'),
  description: z.string().optional(),
  priceKes: z.coerce.number().int().nonnegative('Must be 0 or more'),
  stockQuantity: z.coerce.number().int().nonnegative().optional(),
  reorderThreshold: z.coerce.number().int().nonnegative().optional(),
})

const editSchema = createSchema.omit({ sku: true, stockQuantity: true })

type CreateValues = z.infer<typeof createSchema>
type EditValues = z.infer<typeof editSchema>

interface ProductFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  product?: Product | null
  onSuccess: () => void
}

export default function ProductFormSheet({ open, onOpenChange, mode, product, onSuccess }: ProductFormSheetProps) {
  const isCreate = mode === 'create'

  const form = useForm<CreateValues | EditValues>({
    // z.coerce.number() gives these two schemas slightly different inferred
    // input/output types, which trips up Resolver's generic when picked
    // conditionally at runtime - the validation itself is correct either way.
    resolver: zodResolver(isCreate ? createSchema : editSchema) as never,
    defaultValues: isCreate
      ? { sku: '', name: '', category: CATEGORY_OPTIONS[0], imageUrl: '', description: '', priceKes: 0, stockQuantity: 0, reorderThreshold: 5 }
      : {
          name: product?.name ?? '',
          category: product?.category ?? CATEGORY_OPTIONS[0],
          imageUrl: product?.imageUrl ?? '',
          description: product?.description ?? '',
          priceKes: product?.priceKes ?? 0,
          reorderThreshold: product?.reorderThreshold ?? 5,
        },
  })

  async function onSubmit(values: CreateValues | EditValues) {
    try {
      if (isCreate) {
        await productsApi.createProduct(values as CreateValues)
        toast.success('Product created')
      } else {
        await productsApi.updateProduct(product!.id, values)
        toast.success('Product updated')
      }
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isCreate ? 'Add product' : 'Edit product'}
      description={isCreate ? 'Add a new item to the catalog.' : `Editing ${product?.name}`}
      onSubmit={form.handleSubmit(onSubmit)}
      isSubmitting={form.formState.isSubmitting}
      submitLabel={isCreate ? 'Create product' : 'Save changes'}
    >
      <Form {...form}>
        {isCreate && (
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
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
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="priceKes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (KES)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isCreate ? (
            <FormField
              control={form.control}
              name="stockQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial stock</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="reorderThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder threshold</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </Form>
    </FormSheet>
  )
}
