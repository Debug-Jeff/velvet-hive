import { api } from './client'
import type { CreateInventoryMovementInput, InventoryMovement } from '../types/inventory'

export function listInventoryMovements(productId?: number, range?: { from?: Date; to?: Date }) {
  const params = new URLSearchParams()
  if (productId) params.set('productId', String(productId))
  if (range?.from) params.set('from', range.from.toISOString())
  if (range?.to) params.set('to', range.to.toISOString())
  const query = params.toString()
  return api.get<InventoryMovement[]>(`/inventory/movements${query ? `?${query}` : ''}`)
}

export function createInventoryMovement(input: CreateInventoryMovementInput) {
  return api.post<InventoryMovement>('/inventory/movements', input)
}
