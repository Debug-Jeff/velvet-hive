import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../middleware/requireAuth'
import { requirePermission } from '../../middleware/requirePermission'
import {
  cancelOrderSchema,
  createOrderSchema,
  idParamSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
} from './orders.schema'
import * as ordersController from './orders.controller'

const router = Router()

router.post(
  '/',
  requireAuth,
  requirePermission('orders:create'),
  validate({ body: createOrderSchema }),
  asyncHandler(ordersController.createHandler),
)

router.get('/', requireAuth, validate({ query: listOrdersQuerySchema }), asyncHandler(ordersController.listHandler))

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

// No requirePermission here - cancelHandler itself branches: staff with
// orders:update:status can cancel any cancellable order (existing behavior),
// customers without it can only cancel their own order before it's paid.
router.post(
  '/:id/cancel',
  requireAuth,
  validate({ params: idParamSchema, body: cancelOrderSchema }),
  asyncHandler(ordersController.cancelHandler),
)

export default router
