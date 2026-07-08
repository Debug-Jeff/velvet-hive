import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../middleware/requireAuth'
import { requirePermission } from '../../middleware/requirePermission'
import { cancelOrderSchema, createOrderSchema, idParamSchema, updateOrderStatusSchema } from './orders.schema'
import * as ordersController from './orders.controller'

const router = Router()

router.post(
  '/',
  requireAuth,
  requirePermission('orders:create'),
  validate({ body: createOrderSchema }),
  asyncHandler(ordersController.createHandler),
)

router.get('/', requireAuth, asyncHandler(ordersController.listHandler))

router.get(
  '/:id',
  requireAuth,
  validate({ params: idParamSchema }),
  asyncHandler(ordersController.getByIdHandler),
)

router.patch(
  '/:id/status',
  requireAuth,
  requirePermission('orders:update:status'),
  validate({ params: idParamSchema, body: updateOrderStatusSchema }),
  asyncHandler(ordersController.updateStatusHandler),
)

router.post(
  '/:id/cancel',
  requireAuth,
  requirePermission('orders:update:status'),
  validate({ params: idParamSchema, body: cancelOrderSchema }),
  asyncHandler(ordersController.cancelHandler),
)

export default router
