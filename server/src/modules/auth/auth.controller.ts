import type { Request, Response } from 'express'
import { ApiError } from '../../lib/apiError'
import * as authService from './auth.service'
import { REFRESH_TOKEN_TTL_MS } from './jwt'
import { env } from '../../config/env'

const REFRESH_COOKIE_NAME = 'refreshToken'
const isProd = process.env.NODE_ENV === 'production'

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_TTL_MS,
  })
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' })
}

export async function registerHandler(req: Request, res: Response) {
  const result = await authService.register(req.body)
  res.status(201).json({ message: 'Account created. Check your email for a verification code.', email: result.email })
}

export async function verifyEmailHandler(req: Request, res: Response) {
  const result = await authService.verifyEmail({ ...req.body, ip: req.ip })
  setRefreshCookie(res, result.refreshToken)
  res.json({ user: result.user, accessToken: result.accessToken })
}

export async function resendVerificationHandler(req: Request, res: Response) {
  await authService.resendVerification(req.body.email)
  res.json({ message: 'If an account with that email exists and is unverified, a new code has been sent.' })
}

export async function loginHandler(req: Request, res: Response) {
  const result = await authService.login({ ...req.body, ip: req.ip, userAgent: req.headers['user-agent'] })
  setRefreshCookie(res, result.refreshToken)
  res.json({ user: result.user, accessToken: result.accessToken })
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  await authService.forgotPassword(req.body.email)
  res.json({ message: 'If an account with that email exists, a password reset code has been sent.' })
}

export async function resetPasswordHandler(req: Request, res: Response) {
  await authService.resetPassword(req.body)
  res.json({ message: 'Password reset. Please log in with your new password.' })
}

export async function refreshHandler(req: Request, res: Response) {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME]
  if (!rawToken) throw ApiError.unauthorized('No session found', 'NO_REFRESH_TOKEN')

  const result = await authService.refresh(rawToken, req.ip)
  setRefreshCookie(res, result.refreshToken)
  res.json({ user: result.user, accessToken: result.accessToken })
}

export async function logoutHandler(req: Request, res: Response) {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME]
  if (rawToken) await authService.logout(rawToken, req.ip, req.headers['user-agent'])
  clearRefreshCookie(res)
  res.status(204).send()
}

export async function updateProfileHandler(req: Request, res: Response) {
  const user = await authService.updateOwnProfile(req.user!.id, req.body)
  res.json({ user })
}

export async function changePasswordHandler(req: Request, res: Response) {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME]
  await authService.changePassword({ ...req.body, userId: req.user!.id, currentRefreshToken: rawToken })
  res.json({ message: 'Password changed.' })
}

export async function uploadAvatarHandler(req: Request, res: Response) {
  if (!req.file) throw ApiError.badRequest('No file uploaded', 'NO_FILE')
  const user = await authService.updateAvatar(req.user!.id, req.file)
  res.json({ user })
}

export function googleInitiateHandler(_req: Request, res: Response) {
  if (!env.GOOGLE_CLIENT_ID) throw ApiError.badRequest('Google sign-in is not configured', 'GOOGLE_NOT_CONFIGURED')
  res.redirect(authService.getGoogleAuthUrl())
}

export async function googleCallbackHandler(req: Request, res: Response) {
  const { code, error } = req.query

  if (error || typeof code !== 'string') {
    return res.redirect(`${env.FRONTEND_URL}/login?error=google_oauth_failed`)
  }

  try {
    const result = await authService.handleGoogleCallback(code, req.ip)
    setRefreshCookie(res, result.refreshToken)
    res.redirect(env.FRONTEND_URL)
  } catch {
    res.redirect(`${env.FRONTEND_URL}/login?error=google_oauth_failed`)
  }
}
