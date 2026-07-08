import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../lib/apiError'
import { ensurePermissionsCacheLoaded, roleHasPermission } from '../lib/permissionsCache'

export function requirePermission(permissionKey: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized())

    await ensurePermissionsCacheLoaded()

    if (!roleHasPermission(req.user.roleId, permissionKey)) {
      return next(ApiError.forbidden(`Missing required permission: ${permissionKey}`))
    }

    next()
  }
}
