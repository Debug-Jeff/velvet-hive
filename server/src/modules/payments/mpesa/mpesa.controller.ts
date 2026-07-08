import type { Request, Response } from 'express'
import { prisma } from '../../../lib/prisma'
import { ApiError } from '../../../lib/apiError'
import { getPayableOrderOrThrow, confirmOrderPayment, markPaymentFailed } from '../payments.service'
import * as daraja from './daraja.service'

export async function stkPushHandler(req: Request, res: Response) {
  const order = await getPayableOrderOrThrow(req.body.orderId, req.user!.id)

  const result = await daraja.stkPush({
    phone: req.body.phone,
    amountKes: order.totalKes,
    accountReference: order.id,
    description: `${order.id} payment`,
  })

  if (result.ResponseCode !== '0') {
    throw ApiError.badRequest(result.ResponseDescription || 'Failed to initiate M-Pesa payment', 'STK_PUSH_FAILED')
  }

  await prisma.payment.create({
    data: {
      orderId: order.id,
      method: 'MPESA',
      status: 'PENDING',
      amountKes: order.totalKes,
      providerRef: result.CheckoutRequestID,
      rawPayload: result,
    },
  })

  res.status(201).json({
    merchantRequestId: result.MerchantRequestID,
    checkoutRequestId: result.CheckoutRequestID,
    customerMessage: result.CustomerMessage,
  })
}

interface StkCallbackItem {
  Name: string
  Value?: string | number
}

export async function callbackHandler(req: Request, res: Response) {
  const callback = req.body?.Body?.stkCallback
  const ack = { ResultCode: 0, ResultDesc: 'Accepted' }

  if (!callback?.CheckoutRequestID) return res.status(200).json(ack)

  // Only ever transition an existing PENDING payment we created ourselves - never
  // create orders/payments from an inbound callback, which isn't cryptographically signed.
  const payment = await prisma.payment.findUnique({ where: { providerRef: callback.CheckoutRequestID } })
  if (!payment || payment.status !== 'PENDING') return res.status(200).json(ack)

  if (callback.ResultCode === 0) {
    const items: StkCallbackItem[] = callback.CallbackMetadata?.Item ?? []
    const receipt = items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value
    await confirmOrderPayment(payment.id, receipt ? String(receipt) : undefined)
  } else {
    await markPaymentFailed(payment.id, callback.ResultDesc || 'M-Pesa payment failed')
  }

  res.status(200).json(ack)
}
