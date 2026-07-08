import type { Product } from './product'

export type InventoryMovementType = 'IN' | 'OUT' | 'ADJUSTMENT'

export interface InventoryMovement {
  id: string
  productId: number
  product: Product
  type: InventoryMovementType
  quantity: number
  reason: string
  referenceOrderId: string | null
  performedByUserId: string
  performedBy?: { id: string; firstName: string; lastName: string; email: string }
  stockAfter: number
  createdAt: string
}

export interface CreateInventoryMovementInput {
  productId: number
  type: InventoryMovementType
  quantity: number
  reason: string
}
