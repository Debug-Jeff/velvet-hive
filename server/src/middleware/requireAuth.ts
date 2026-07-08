import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../lib/apiError'
import { verifyAccessToken } from '../modules/auth/jwt'

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing access token', 'NO_ACCESS_TOKEN'))
  }

  const token = header.slice('Bearer '.length)

  try {
    const payload = verifyAccessToken(token)
    req.user = { id: payload.sub, roleId: payload.roleId, roleName: payload.roleName, email: payload.email }
    next()
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    const code = name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_ACCESS_TOKEN'
    next(ApiError.unauthorized('Invalid or expired access token', code))
  }
}
