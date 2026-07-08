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
  const orders = canReadAll ? await ordersService.listAllOrders() : await ordersService.listOrdersForUser(req.user!.id)
  res.json(orders)
}

export async function updateStatusHandler(req: Request, res: Response) {
  const id = req.params.id as string
  const order = await ordersService.updateOrderStatus(id, req.body.status)
  res.json(order)
}

export async function cancelHandler(req: Request, res: Response) {
  const id = req.params.id as string
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
