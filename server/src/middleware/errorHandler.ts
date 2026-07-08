import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { MulterError } from 'multer'
import { ApiError } from '../lib/apiError'
import { Prisma } from '../generated/prisma/client'

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } })
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } })
  }

  if (err instanceof MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 2MB)' : err.message
    return res.status(400).json({ error: { code: 'UPLOAD_ERROR', message } })
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: err.flatten() },
    })
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field'
      return res.status(409).json({ error: { code: 'DUPLICATE_VALUE', message: `A record with this ${target} already exists` } })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Record not found' } })
    }
    if (err.code === 'P2003') {
      return res.status(409).json({
        error: { code: 'REFERENCED_RECORD', message: 'This record is referenced by other data and cannot be deleted' },
      })
    }
  }

  console.error(err)
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } })
}
