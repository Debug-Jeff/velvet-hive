import { z } from 'zod'

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const listProductsQuerySchema = z.object({
  category: z.string().optional(),
})

export const createProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  imageUrl: z.string().min(1),
  description: z.string().optional(),
  priceKes: z.coerce.number().int().nonnegative(),
  stockQuantity: z.coerce.number().int().nonnegative().optional(),
  reorderThreshold: z.coerce.number().int().nonnegative().optional(),
})

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  imageUrl: z.string().min(1).optional(),
  description: z.string().optional(),
  priceKes: z.coerce.number().int().nonnegative().optional(),
  reorderThreshold: z.coerce.number().int().nonnegative().optional(),
})
