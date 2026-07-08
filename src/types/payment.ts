export type PaymentMethod = 'CARD' | 'MPESA'
export type PaymentStatus = 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'

export interface Payment {
  id: string
  orderId: string
  method: PaymentMethod
  status: PaymentStatus
  amountKes: number
  providerRef: string | null
  providerTransactionId: string | null
  failureReason: string | null
  createdAt: string
  updatedAt: string
}
