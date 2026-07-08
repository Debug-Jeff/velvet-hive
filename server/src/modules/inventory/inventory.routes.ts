import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../middleware/requireAuth'
import { requirePermission } from '../../middleware/requirePermission'
import { createMovementSchema, listMovementsQuerySchema } from './inventory.schema'
import * as inventoryController from './inventory.controller'

const router = Router()

router.get(
  '/movements',
  requireAuth,
  requirePermission('inventory:read'),
  validate({ query: listMovementsQuerySchema }),
  asyncHandler(inventoryController.listHandler),
)

router.post(
  '/movements',
  requireAuth,
  requirePermission('inventory:adjust'),
  validate({ body: createMovementSchema }),
  asyncHandler(inventoryController.createHandler),
)

export default router
