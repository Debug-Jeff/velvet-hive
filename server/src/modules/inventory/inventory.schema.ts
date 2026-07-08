import { z } from 'zod'

export const listMovementsQuerySchema = z.object({
  productId: z.coerce.number().int().positive().optional(),
})

export const createMovementSchema = z.object({
  productId: z.coerce.number().int().positive(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  // For IN/OUT this is the quantity moved. For ADJUSTMENT this is the new
  // absolute stock count from a physical stock take, not a delta.
  quantity: z.coerce.number().int().nonnegative(),
  reason: z.string().min(1),
})
