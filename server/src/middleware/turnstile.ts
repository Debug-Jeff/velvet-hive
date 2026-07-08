import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../lib/apiError'
import { verifyTurnstileToken } from '../lib/turnstile'
import { asyncHandler } from '../lib/asyncHandler'

export const requireTurnstile = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.body?.turnstileToken
  if (typeof token !== 'string' || !token) {
    throw ApiError.badRequest('Turnstile verification is required', 'TURNSTILE_REQUIRED')
  }

  const isValid = await verifyTurnstileToken(token, req.ip)
  if (!isValid) {
    throw ApiError.badRequest('Turnstile verification failed, please try again', 'TURNSTILE_FAILED')
  }

  next()
})
