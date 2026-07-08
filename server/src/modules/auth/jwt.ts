import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env'
import type { AccessTokenPayload } from './auth.types'

const ACCESS_TOKEN_TTL = '15m'
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
}

export function generateRefreshToken() {
  const raw = crypto.randomBytes(48).toString('hex')
  const tokenHash = hashRefreshToken(raw)
  return { raw, tokenHash }
}

export function hashRefreshToken(raw: string) {
  return crypto.createHmac('sha256', env.JWT_REFRESH_PEPPER).update(raw).digest('hex')
}
