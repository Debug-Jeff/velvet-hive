import { prisma } from '../../lib/prisma'
import { ApiError } from '../../lib/apiError'
import { sendMail } from '../../lib/mailer'
import { orderConfirmationEmail } from '../../lib/emailTemplates'

export async function getPayableOrderOrThrow(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw ApiError.notFound('Order not found')
  if (order.userId !== userId) throw ApiError.forbidden()
  if (order.status !== 'PENDING_PAYMENT') {
    throw ApiError.badRequest(`Order is not payable (status: ${order.status})`, 'ORDER_NOT_PAYABLE')
  }
  return order
}

// Idempotent: safe to call more than once for the same payment (webhook retries,
// a webhook racing a manual "verify" poll, etc.) - only the first call does work.
export async function confirmOrderPayment(paymentId: string, providerTransactionId?: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment) throw new Error(`Payment ${paymentId} not found`)
  if (payment.status === 'SUCCESS') return

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: payment.orderId },
    include: { items: { include: { product: true } }, user: true },
  })

  await prisma.$transaction(async (tx) => {
    const current = await tx.payment.findUnique({ where: { id: paymentId } })
    if (current?.status === 'SUCCESS') return // re-check inside the transaction to avoid a double-decrement race

    await tx.payment.update({
      where: { id: paymentId },
      data: { status: 'SUCCESS', providerTransactionId },
    })
    await tx.order.update({ where: { id: order.id }, data: { status: 'PAID' } })

    for (const item of order.items) {
      const product = await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      })
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: 'OUT',
          quantity: item.quantity,
          reason: `sale_order_${order.id}`,
          referenceOrderId: order.id,
          performedByUserId: order.userId,
          stockAfter: product.stockQuantity,
        },
      })
    }
  })

  const { subject, html } = orderConfirmationEmail({
    firstName: order.user.firstName,
    orderId: order.id,
    totalKes: order.totalKes,
    items: order.items.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      priceAtPurchaseKes: i.priceAtPurchaseKes,
    })),
  })
  await sendMail({ to: order.user.email, subject, html })
}

export async function markPaymentFailed(paymentId: string, reason: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment || payment.status === 'SUCCESS') return

  await prisma.payment.update({ where: { id: paymentId }, data: { status: 'FAILED', failureReason: reason } })
  await prisma.order.update({ where: { id: payment.orderId }, data: { status: 'PAYMENT_FAILED' } })
}
