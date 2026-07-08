import { prisma } from '../../lib/prisma'
import { ApiError } from '../../lib/apiError'
import type { InventoryMovementType } from '../../generated/prisma/client'

export function listMovements(productId?: number) {
  return prisma.inventoryMovement.findMany({
    where: productId ? { productId } : undefined,
    include: {
      product: true,
      performedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

interface CreateMovementInput {
  productId: number
  type: InventoryMovementType
  quantity: number
  reason: string
  performedByUserId: string
}

export async function createMovement(input: CreateMovementInput) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: input.productId } })
    if (!product) throw ApiError.notFound('Product not found')

    let newStock: number
    if (input.type === 'IN') {
      newStock = product.stockQuantity + input.quantity
    } else if (input.type === 'OUT') {
      if (input.quantity > product.stockQuantity) {
        throw ApiError.badRequest(
          `Cannot remove ${input.quantity} units - only ${product.stockQuantity} in stock`,
          'INSUFFICIENT_STOCK',
        )
      }
      newStock = product.stockQuantity - input.quantity
    } else {
      // ADJUSTMENT: quantity is the new absolute stock count from a physical count.
      newStock = input.quantity
    }

    const updated = await tx.product.update({ where: { id: input.productId }, data: { stockQuantity: newStock } })

    return tx.inventoryMovement.create({
      data: {
        productId: input.productId,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason,
        performedByUserId: input.performedByUserId,
        stockAfter: updated.stockQuantity,
      },
      include: { product: true },
    })
  })
}
