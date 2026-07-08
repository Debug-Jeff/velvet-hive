import type { Request, Response } from 'express'
import { ApiError } from '../../lib/apiError'
import { ensurePermissionsCacheLoaded, roleHasPermission } from '../../lib/permissionsCache'
import * as ordersService from './orders.service'

export async function createHandler(req: Request, res: Response) {
  const order = await ordersService.createOrder({ ...req.body, userId: req.user!.id })
  res.status(201).json(order)
}

export async function listHandler(req: Request, res: Response) {
  await ensurePermissionsCacheLoaded()
  const canReadAll = roleHasPermission(req.user!.roleId, 'orders:read:all')
  const { from, to } = req.query as unknown as { from?: Date; to?: Date }
  const orders = canReadAll
    ? await ordersService.listAllOrders({ from, to })
    : await ordersService.listOrdersForUser(req.user!.id, { from, to })
  res.json(orders)
}

export async function updateStatusHandler(req: Request, res: Response) {
  const id = req.params.id as string
  const order = await ordersService.updateOrderStatus(id, req.body.status)
  res.json(order)
}

export async function cancelHandler(req: Request, res: Response) {
  const id = req.params.id as string

  await ensurePermissionsCacheLoaded()
  const canManageAnyOrder = roleHasPermission(req.user!.roleId, 'orders:update:status')

  if (!canManageAnyOrder) {
    // Customer path: can only cancel their own order, and only before it's
    // been paid - once paid, cancellation is a staff decision (it involves
    // stock restoration and, per the flow, means "we're cancelling a paid
    // order" which is a different situation than "I changed my mind before paying").
    const existing = await ordersService.getOrderById(id)
    if (!existing) throw ApiError.notFound('Order not found')
    if (existing.userId !== req.user!.id) throw ApiError.forbidden()
    if (existing.status !== 'PENDING_PAYMENT') {
      throw ApiError.badRequest('You can only cancel an order before it has been paid', 'ORDER_STATUS_LOCKED')
    }
  }

  const order = await ordersService.cancelOrder(id, req.body.reason, req.user!.id)
  res.json(order)
}

export async function getByIdHandler(req: Request, res: Response) {
  const id = req.params.id as string
  const order = await ordersService.getOrderById(id)
  if (!order) throw ApiError.notFound('Order not found')

  await ensurePermissionsCacheLoaded()
  const canReadAll = roleHasPermission(req.user!.roleId, 'orders:read:all')
  if (!canReadAll && order.userId !== req.user!.id) throw ApiError.forbidden()

  res.json(order)
}
