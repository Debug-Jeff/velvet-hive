import { api } from './client'
import type { CreateOrderInput, Order, OrderStatus } from '../types/order'

export function createOrder(input: CreateOrderInput) {
  return api.post<Order>('/orders', input)
}

export function listOrders() {
  return api.get<Order[]>('/orders')
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
