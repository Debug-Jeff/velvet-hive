import type { Product } from './product'
import type { Payment } from './payment'

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED'
  | 'REFUNDED'

export interface OrderItem {
  id: string
  orderId: string
  productId: number
  quantity: number
  priceAtPurchaseKes: number
  product: Product
}

export interface Order {
  id: string
  userId: string
  status: OrderStatus
  totalKes: number
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  cancellationReason?: string | null
  cancelledAt?: string | null
  items: OrderItem[]
  payments: Payment[]
  createdAt: string
  updatedAt: string
}

export interface CreateOrderInput {
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  items: Array<{ productId: number; quantity: number }>
}
