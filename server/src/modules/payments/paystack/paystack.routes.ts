import { Router } from 'express'
import { asyncHandler } from '../../../lib/asyncHandler'
import { validate } from '../../../middleware/validate'
import { requireAuth } from '../../../middleware/requireAuth'
import { initializePaymentSchema, referenceParamSchema } from '../payments.schema'
import * as paystackController from './paystack.controller'

const router = Router()

router.post(
  '/initialize',
  requireAuth,
  validate({ body: initializePaymentSchema }),
  asyncHandler(paystackController.initializeHandler),
)

// Public - called directly by Paystack's servers, authenticated via HMAC signature instead of a session.
router.post('/webhook', asyncHandler(paystackController.webhookHandler))

router.get(
  '/verify/:reference',
  requireAuth,
  validate({ params: referenceParamSchema }),
  asyncHandler(paystackController.verifyHandler),
)

export default router
