import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../middleware/requireAuth'
import { requirePermission } from '../../middleware/requirePermission'
import { createUserSchema, idParamSchema, updateUserSchema } from './users.schema'
import * as usersController from './users.controller'

const router = Router()

router.use(requireAuth, requirePermission('users:manage'))

router.get('/', asyncHandler(usersController.listHandler))
router.post('/', validate({ body: createUserSchema }), asyncHandler(usersController.createHandler))
router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateUserSchema }),
  asyncHandler(usersController.updateHandler),
)
router.delete('/:id', validate({ params: idParamSchema }), asyncHandler(usersController.deleteHandler))

export default router
