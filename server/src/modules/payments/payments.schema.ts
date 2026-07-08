import { z } from 'zod'

export const initializePaymentSchema = z.object({
  orderId: z.string().min(1),
})

export const stkPushSchema = z.object({
  orderId: z.string().min(1),
  phone: z.string().min(9, 'Enter a valid phone number'),
})

export const referenceParamSchema = z.object({
  reference: z.string().min(1),
})
