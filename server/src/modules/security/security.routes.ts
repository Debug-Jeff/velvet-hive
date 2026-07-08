import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler'
import { requireAuth } from '../../middleware/requireAuth'
import { requirePermission } from '../../middleware/requirePermission'
import { listSecurityEvents } from '../../lib/securityEvents'

const router = Router()

router.get(
  '/events',
  requireAuth,
  requirePermission('users:manage'),
  asyncHandler(async (_req, res) => {
    res.json(await listSecurityEvents())
  }),
)

export default router
