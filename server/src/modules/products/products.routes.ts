import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../middleware/requireAuth'
import { requirePermission } from '../../middleware/requirePermission'
import {
  createProductSchema,
  idParamSchema,
  listProductsQuerySchema,
  updateProductSchema,
} from './products.schema'
import * as productsController from './products.controller'

const router = Router()

router.get('/', validate({ query: listProductsQuerySchema }), asyncHandler(productsController.listHandler))
router.get('/:id', validate({ params: idParamSchema }), asyncHandler(productsController.getByIdHandler))

router.post(
  '/',
  requireAuth,
  requirePermission('products:create'),
  validate({ body: createProductSchema }),
  asyncHandler(productsController.createHandler),
)

router.put(
  '/:id',
  requireAuth,
  requirePermission('products:update'),
  validate({ params: idParamSchema, body: updateProductSchema }),
  asyncHandler(productsController.updateHandler),
)

router.delete(
  '/:id',
  requireAuth,
  requirePermission('products:delete'),
  validate({ params: idParamSchema }),
  asyncHandler(productsController.deactivateHandler),
)

export default router
