import { Router } from 'express'
import { asyncHandler } from '../../../lib/asyncHandler'
import { validate } from '../../../middleware/validate'
import { requireAuth } from '../../../middleware/requireAuth'
import { stkPushSchema } from '../payments.schema'
import * as mpesaController from './mpesa.controller'

const router = Router()

router.post('/stk-push', requireAuth, validate({ body: stkPushSchema }), asyncHandler(mpesaController.stkPushHandler))

// Public - called directly by Safaricom's servers.
router.post('/callback', asyncHandler(mpesaController.callbackHandler))

export default router
