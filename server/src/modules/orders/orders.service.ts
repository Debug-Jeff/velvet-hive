import { prisma } from '../../lib/prisma'
import { ApiError } from '../../lib/apiError'
import { sendMail } from '../../lib/mailer'
import { orderCancellationEmail } from '../../lib/emailTemplates'
import type { OrderStatus } from '../../generated/prisma/client'

interface CreateOrderInput {
  userId: string
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  items: Array<{ productId: number; quantity: number }>
}

export async function createOrder(input: CreateOrderInput) {
  const productIds = input.items.map((i) => i.productId)
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } })
  const productById = new Map(products.map((p) => [p.id, p]))

  for (const item of input.items) {
    const product = productById.get(item.productId)
    if (!product) throw ApiError.notFound(`Product ${item.productId} not found`)
    if (product.stockQuantity < item.quantity) {
      throw ApiError.badRequest(`Insufficient stock for "${product.name}"`, 'INSUFFICIENT_STOCK')
    }
  }

  const totalKes = input.items.reduce((sum, item) => {
    const product = productById.get(item.productId)!
    return sum + product.priceKes * item.quantity
  }, 0)

  return prisma.order.create({
    data: {
      userId: input.userId,
      shippingName: input.shippingName,
      shippingPhone: input.shippingPhone,
      shippingAddress: input.shippingAddress,
      totalKes,
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchaseKes: productById.get(item.productId)!.priceKes,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  })
}

interface DateRange {
  from?: Date
  to?: Date
}

function createdAtWhere({ from, to }: DateRange) {
  if (!from && !to) return undefined
  return { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) }
}

export function listAllOrders(range: DateRange = {}) {
  return prisma.order.findMany({
    where: { createdAt: createdAtWhere(range) },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } }, payments: true },
  })
}

export function listOrdersForUser(userId: string, range: DateRange = {}) {
  return prisma.order.findMany({
    where: { userId, createdAt: createdAtWhere(range) },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } }, payments: true },
  })
}

export function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, payments: true },
  })
}

// Orders can only be manually progressed once payment has actually succeeded -
// PENDING_PAYMENT/PAID/PAYMENT_FAILED are system-controlled transitions owned
// by the payment confirmation flow (payments.service.ts), never set here.
const MANUALLY_PROGRESSABLE_FROM: OrderStatus[] = ['PAID', 'PROCESSING', 'SHIPPED']

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) throw ApiError.notFound('Order not found')

  if (!MANUALLY_PROGRESSABLE_FROM.includes(order.status)) {
    throw ApiError.badRequest(`Cannot update status of an order that is ${order.status}`, 'ORDER_STATUS_LOCKED')
  }

  return prisma.order.update({
    where: { id },
    data: { status },
    include: { items: { include: { product: true } }, payments: true },
  })
}

// Stock was already decremented once payment succeeded (see confirmOrderPayment) -
// only these statuses need it restored on cancellation.
const STOCK_ALREADY_DECREMENTED_FROM: OrderStatus[] = ['PAID', 'PROCESSING', 'SHIPPED']
const CANCELLABLE_FROM: OrderStatus[] = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED']

export async function cancelOrder(id: string, reason: string, cancelledByUserId: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, user: true },
  })
  if (!order) throw ApiError.notFound('Order not found')

  if (!CANCELLABLE_FROM.includes(order.status)) {
    throw ApiError.badRequest(`Cannot cancel an order that is ${order.status}`, 'ORDER_STATUS_LOCKED')
  }

  const shouldRestoreStock = STOCK_ALREADY_DECREMENTED_FROM.includes(order.status)

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: { status: 'CANCELLED', cancellationReason: reason, cancelledAt: new Date() },
    })

    if (shouldRestoreStock) {
      for (const item of order.items) {
        const product = await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        })
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            reason: `Order ${order.id} cancelled - stock restored`,
            referenceOrderId: order.id,
            performedByUserId: cancelledByUserId,
            stockAfter: product.stockQuantity,
          },
        })
      }
    }
  })

  const { subject, html } = orderCancellationEmail({ firstName: order.user.firstName, orderId: order.id, reason })
  await sendMail({ to: order.user.email, subject, html })

  return getOrderById(id)
}

const AUTO_CANCEL_AFTER_MS = 48 * 60 * 60 * 1000

// Orders stuck in PENDING_PAYMENT never had stock decremented, so cancelling
// them never restores stock - the "performed by" attribution on that (unused)
// path is moot, so the order's own customer id is a safe placeholder.
export async function autoCancelStaleOrders() {
  const cutoff = new Date(Date.now() - AUTO_CANCEL_AFTER_MS)
  const stale = await prisma.order.findMany({
    where: { status: 'PENDING_PAYMENT', createdAt: { lt: cutoff } },
    select: { id: true, userId: true },
  })

  for (const order of stale) {
    await cancelOrder(order.id, 'Automatically cancelled - payment was not completed within 48 hours', order.userId)
  }

  return stale.length
}
