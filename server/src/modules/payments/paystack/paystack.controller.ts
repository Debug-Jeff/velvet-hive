import crypto from 'node:crypto'
import type { Request, Response } from 'express'
import { prisma } from '../../../lib/prisma'
import { ApiError } from '../../../lib/apiError'
import { getPayableOrderOrThrow, confirmOrderPayment, markPaymentFailed } from '../payments.service'
import * as paystackService from './paystack.service'
import { env } from '../../../config/env'

export async function initializeHandler(req: Request, res: Response) {
  const order = await getPayableOrderOrThrow(req.body.orderId, req.user!.id)
  const reference = `psk_${crypto.randomBytes(12).toString('hex')}`

  await prisma.payment.create({
    data: {
      orderId: order.id,
      method: 'CARD',
      status: 'INITIATED',
      amountKes: order.totalKes,
      providerRef: reference,
    },
  })

  const result = await paystackService.initializeTransaction({
    email: req.user!.email,
    amountKes: order.totalKes,
    reference,
    callbackUrl: `${env.FRONTEND_URL}/checkout/${order.id}/confirming?reference=${reference}`,
  })

  res.status(201).json({ authorizationUrl: result.authorizationUrl, reference: result.reference })
}

export async function webhookHandler(req: Request, res: Response) {
  const signature = req.headers['x-paystack-signature'] as string | undefined
  const valid = req.rawBody && paystackService.verifyWebhookSignature(req.rawBody, signature)

  if (!valid) {
    // Acknowledge with 200 anyway so Paystack doesn't retry a request we'll never accept,
    // but do not process it - just ignore silently from the caller's perspective.
    return res.status(200).json({ received: true })
  }

  const event = req.body

  if (event.event === 'charge.success') {
    const reference = event.data?.reference
    const payment = await prisma.payment.findUnique({ where: { providerRef: reference } })
    if (payment) {
      await confirmOrderPayment(payment.id, String(event.data.id))
    }
  } else if (event.event === 'charge.failed') {
    const reference = event.data?.reference
    const payment = await prisma.payment.findUnique({ where: { providerRef: reference } })
    if (payment) {
      await markPaymentFailed(payment.id, event.data?.gateway_response ?? 'Payment failed')
    }
  }

  res.status(200).json({ received: true })
}

export async function verifyHandler(req: Request, res: Response) {
  const { reference } = req.params as { reference: string }
  const payment = await prisma.payment.findUnique({ where: { providerRef: reference }, include: { order: true } })
  if (!payment) throw ApiError.notFound('Payment not found')
  if (payment.order.userId !== req.user!.id) throw ApiError.forbidden()

  if (payment.status !== 'SUCCESS') {
    const result = await paystackService.verifyTransaction(reference)
    if (result.status === 'success') {
      await confirmOrderPayment(payment.id, String(result.id))
    } else if (result.status === 'failed') {
      await markPaymentFailed(payment.id, 'Payment failed')
    }
  }

  const updated = await prisma.payment.findUnique({ where: { id: payment.id }, include: { order: true } })
  res.json(updated)
}
