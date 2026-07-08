import { api } from './client'
import type { CreateOrderInput, Order, OrderStatus } from '../types/order'

export function createOrder(input: CreateOrderInput) {
  return api.post<Order>('/orders', input)
}

export function listOrders(range?: { from?: Date; to?: Date }) {
  const params = new URLSearchParams()
  if (range?.from) params.set('from', range.from.toISOString())
  if (range?.to) params.set('to', range.to.toISOString())
  const query = params.toString()
  return api.get<Order[]>(`/orders${query ? `?${query}` : ''}`)
}

export function getOrder(id: string) {
  return api.get<Order>(`/orders/${id}`)
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  return api.patch<Order>(`/orders/${id}/status`, { status })
}

export function cancelOrder(id: string, reason: string) {
  return api.post<Order>(`/orders/${id}/cancel`, { reason })
}
