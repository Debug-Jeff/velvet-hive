import { z } from 'zod'

export const idParamSchema = z.object({
  id: z.string().min(1),
})

export const listOrdersQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PROCESSING', 'SHIPPED', 'DELIVERED']),
})

export const cancelOrderSchema = z.object({
  reason: z.string().min(1, 'A reason is required'),
})

export const createOrderSchema = z.object({
  shippingName: z.string().min(1),
  shippingPhone: z.string().min(1),
  shippingAddress: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .min(1, 'Order must contain at least one item'),
})
