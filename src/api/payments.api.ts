import { api } from './client'

export function initializePaystack(orderId: string) {
  return api.post<{ authorizationUrl: string; reference: string }>('/payments/paystack/initialize', { orderId })
}

export function verifyPaystack(reference: string) {
  return api.get(`/payments/paystack/verify/${reference}`)
}

export function initiateMpesaStkPush(input: { orderId: string; phone: string }) {
  return api.post<{ merchantRequestId: string; checkoutRequestId: string; customerMessage: string }>(
    '/payments/mpesa/stk-push',
    input,
  )
}
