import { Router } from 'express'
import { asyncHandler } from '../../lib/asyncHandler'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../middleware/requireAuth'
import { credentialsLimiter } from '../../middleware/rateLimit'
import { avatarUpload } from '../../lib/avatarUpload'
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
} from './auth.schema'
import * as authController from './auth.controller'

const router = Router()

router.post('/register', credentialsLimiter, validate({ body: registerSchema }), asyncHandler(authController.registerHandler))
router.post('/verify-email', credentialsLimiter, validate({ body: verifyEmailSchema }), asyncHandler(authController.verifyEmailHandler))
router.post(
  '/resend-verification',
  credentialsLimiter,
  validate({ body: resendVerificationSchema }),
  asyncHandler(authController.resendVerificationHandler),
)
router.post('/login', credentialsLimiter, validate({ body: loginSchema }), asyncHandler(authController.loginHandler))
router.post(
  '/forgot-password',
  credentialsLimiter,
  validate({ body: forgotPasswordSchema }),
  asyncHandler(authController.forgotPasswordHandler),
)
router.post(
  '/reset-password',
  credentialsLimiter,
  validate({ body: resetPasswordSchema }),
  asyncHandler(authController.resetPasswordHandler),
)
router.post('/refresh', asyncHandler(authController.refreshHandler))
router.post('/logout', asyncHandler(authController.logoutHandler))

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

router.patch('/profile', requireAuth, validate({ body: updateProfileSchema }), asyncHandler(authController.updateProfileHandler))
router.patch(
  '/change-password',
  requireAuth,
  validate({ body: changePasswordSchema }),
  asyncHandler(authController.changePasswordHandler),
)
router.post('/avatar', requireAuth, avatarUpload.single('avatar'), asyncHandler(authController.uploadAvatarHandler))

router.get('/google', credentialsLimiter, authController.googleInitiateHandler)
router.get('/google/callback', credentialsLimiter, asyncHandler(authController.googleCallbackHandler))

export default router
