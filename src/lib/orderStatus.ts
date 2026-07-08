import type { OrderStatus } from '@/types/order'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Pending payment',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  PAYMENT_FAILED: 'Payment failed',
  REFUNDED: 'Refunded',
}

export function orderStatusVariant(status: OrderStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PAID':
    case 'DELIVERED':
      return 'default'
    case 'PROCESSING':
    case 'SHIPPED':
      return 'secondary'
    case 'CANCELLED':
    case 'PAYMENT_FAILED':
      return 'destructive'
    default:
      return 'outline'
  }
}

// Mirrors server's orders.service.ts MANUALLY_PROGRESSABLE_FROM - orders can
// only be manually progressed once payment has actually succeeded.
export const MANUALLY_PROGRESSABLE_FROM: OrderStatus[] = ['PAID', 'PROCESSING', 'SHIPPED']

export const NEXT_STATUS_OPTIONS: OrderStatus[] = ['PROCESSING', 'SHIPPED', 'DELIVERED']

// Mirrors server's orders.service.ts CANCELLABLE_FROM.
export const CANCELLABLE_FROM: OrderStatus[] = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED']
