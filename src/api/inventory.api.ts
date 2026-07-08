import { api } from './client'
import type { CreateInventoryMovementInput, InventoryMovement } from '../types/inventory'

export function listInventoryMovements(productId?: number) {
  const query = productId ? `?productId=${productId}` : ''
  return api.get<InventoryMovement[]>(`/inventory/movements${query}`)
}

export function createInventoryMovement(input: CreateInventoryMovementInput) {
  return api.post<InventoryMovement>('/inventory/movements', input)
}
