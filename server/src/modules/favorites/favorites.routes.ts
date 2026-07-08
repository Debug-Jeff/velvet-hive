import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../middleware/requireAuth'
import { productIdParamSchema } from './favorites.schema'
import * as favoritesController from './favorites.controller'

const router = Router()

router.use(requireAuth)

router.get('/', asyncHandler(favoritesController.listHandler))
router.post('/:productId/toggle', validate({ params: productIdParamSchema }), asyncHandler(favoritesController.toggleHandler))

export default router
