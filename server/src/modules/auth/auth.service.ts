import crypto from 'node:crypto'
import axios from 'axios'
import { prisma } from '../../lib/prisma'
import { ApiError } from '../../lib/apiError'
import { sendMail } from '../../lib/mailer'
import { passwordResetEmail, suspiciousLoginEmail, verificationEmail } from '../../lib/emailTemplates'
import { hashPassword, verifyPassword } from './password'
import { generateRefreshToken, hashRefreshToken, signAccessToken, REFRESH_TOKEN_TTL_MS } from './jwt'
import { consumeVerificationCode, createVerificationCode } from './verificationCode.service'
import { saveAvatarFile } from '../../lib/avatarUpload'
import { recordSecurityEvent } from '../../lib/securityEvents'
import { env } from '../../config/env'
import type { AuthUser } from './auth.types'

const CUSTOMER_ROLE_NAME = 'CUSTOMER'

function toAuthUser(user: {
  id: string
  roleId: number
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  avatarUrl?: string | null
  role: { name: string }
}): AuthUser {
  return {
    id: user.id,
    roleId: user.roleId,
    roleName: user.role.name,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
  }
}

async function issueTokens(authUser: AuthUser, ip?: string) {
  const accessToken = signAccessToken({
    sub: authUser.id,
    roleId: authUser.roleId,
    roleName: authUser.roleName,
    email: authUser.email,
  })

  const { raw, tokenHash } = generateRefreshToken()
  await prisma.refreshToken.create({
    data: {
      userId: authUser.id,
      tokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      createdByIp: ip,
    },
  })

  return { accessToken, refreshToken: raw }
}

export async function register(input: {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN')

  const customerRole = await prisma.role.findUnique({ where: { name: CUSTOMER_ROLE_NAME } })
  if (!customerRole) throw new Error('CUSTOMER role is not seeded')

  const passwordHash = await hashPassword(input.password)
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      roleId: customerRole.id,
    },
  })

  const code = await createVerificationCode(user.id, 'EMAIL_VERIFY')
  const { subject, html } = verificationEmail({ firstName: user.firstName, code })
  await sendMail({ to: user.email, subject, html })

  return { email: user.email }
}

export async function verifyEmail(input: { email: string; code: string; ip?: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email }, include: { role: true } })
  if (!user) throw ApiError.badRequest('Invalid email or code', 'INVALID_CODE')

  const valid = await consumeVerificationCode(user.id, 'EMAIL_VERIFY', input.code)
  if (!valid) throw ApiError.badRequest('Invalid or expired code', 'INVALID_CODE')

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, lastLoginAt: new Date(), lastLoginIp: input.ip },
  })

  const authUser = toAuthUser(user)
  const tokens = await issueTokens(authUser, input.ip)
  return { user: authUser, ...tokens }
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (user && !user.emailVerified) {
    const code = await createVerificationCode(user.id, 'EMAIL_VERIFY')
    const { subject, html } = verificationEmail({ firstName: user.firstName, code })
    await sendMail({ to: user.email, subject, html })
  }
  // Always respond the same way regardless of whether the account exists or is
  // already verified, to avoid leaking account existence to an attacker.
}

export async function login(input: { email: string; password: string; ip?: string; userAgent?: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email }, include: { role: true } })
  if (!user || !user.isActive) {
    await recordSecurityEvent({
      type: 'LOGIN_FAILED',
      email: input.email,
      ip: input.ip,
      userAgent: input.userAgent,
      detail: !user ? 'Unknown email' : 'Account inactive',
    })
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS')
  }

  const valid = await verifyPassword(input.password, user.passwordHash)
  if (!valid) {
    await recordSecurityEvent({
      type: 'LOGIN_FAILED',
      userId: user.id,
      email: user.email,
      ip: input.ip,
      userAgent: input.userAgent,
      detail: 'Wrong password',
    })
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS')
  }

  if (!user.emailVerified) {
    throw ApiError.forbidden('Please verify your email before logging in', 'EMAIL_NOT_VERIFIED')
  }

  if (user.lastLoginIp && input.ip && user.lastLoginIp !== input.ip) {
    const { subject, html } = suspiciousLoginEmail({
      firstName: user.firstName,
      ip: input.ip,
      time: new Date().toISOString(),
      userAgent: input.userAgent ?? 'unknown device',
    })
    await sendMail({ to: user.email, subject, html })
    await recordSecurityEvent({
      type: 'SUSPICIOUS_LOGIN',
      userId: user.id,
      email: user.email,
      ip: input.ip,
      userAgent: input.userAgent,
      detail: `Previous IP: ${user.lastLoginIp}`,
    })
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), lastLoginIp: input.ip } })
  await recordSecurityEvent({ type: 'LOGIN', userId: user.id, email: user.email, ip: input.ip, userAgent: input.userAgent })

  const authUser = toAuthUser(user)
  const tokens = await issueTokens(authUser, input.ip)
  return { user: authUser, ...tokens }
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (user && user.isActive) {
    const code = await createVerificationCode(user.id, 'PASSWORD_RESET')
    const { subject, html } = passwordResetEmail({ firstName: user.firstName, code })
    await sendMail({ to: user.email, subject, html })
  }
  // Same rationale as resendVerification: uniform response either way.
}

export async function resetPassword(input: { email: string; code: string; newPassword: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) throw ApiError.badRequest('Invalid email or code', 'INVALID_CODE')

  const valid = await consumeVerificationCode(user.id, 'PASSWORD_RESET', input.code)
  if (!valid) throw ApiError.badRequest('Invalid or expired code', 'INVALID_CODE')

  const passwordHash = await hashPassword(input.newPassword)
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    // Resetting a password should invalidate every existing session, in case the
    // reset was triggered because of a compromised account.
    prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
  ])
}

export async function refresh(rawToken: string, ip?: string) {
  const tokenHash = hashRefreshToken(rawToken)
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { include: { role: true } } },
  })

  if (!stored) throw ApiError.unauthorized('Invalid session', 'INVALID_REFRESH_TOKEN')

  if (stored.revokedAt) {
    // Reuse of a rotated-out token: possible theft. Revoke the whole family for this user.
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    throw ApiError.unauthorized('Session invalidated, please log in again', 'REFRESH_TOKEN_REUSED')
  }

  if (stored.expiresAt < new Date()) throw ApiError.unauthorized('Session expired', 'REFRESH_TOKEN_EXPIRED')

  if (!stored.user.isActive) throw ApiError.unauthorized('Account is deactivated', 'ACCOUNT_DEACTIVATED')

  const authUser = toAuthUser(stored.user)
  const { raw, tokenHash: newHash } = generateRefreshToken()

  const newToken = await prisma.refreshToken.create({
    data: {
      userId: authUser.id,
      tokenHash: newHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      createdByIp: ip,
    },
  })

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date(), replacedById: newToken.id },
  })

  const accessToken = signAccessToken({
    sub: authUser.id,
    roleId: authUser.roleId,
    roleName: authUser.roleName,
    email: authUser.email,
  })

  return { user: authUser, accessToken, refreshToken: raw }
}

export async function logout(rawToken: string, ip?: string, userAgent?: string) {
  const tokenHash = hashRefreshToken(rawToken)
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } })

  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  })

  if (stored) {
    await recordSecurityEvent({ type: 'LOGOUT', userId: stored.userId, email: stored.user.email, ip, userAgent })
  }
}

export async function updateOwnProfile(
  userId: string,
  input: { firstName?: string; lastName?: string; phone?: string },
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: input,
    include: { role: true },
  })
  return toAuthUser(user)
}

export async function updateAvatar(userId: string, file: Express.Multer.File) {
  const avatarUrl = await saveAvatarFile(userId, file)
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    include: { role: true },
  })
  return toAuthUser(user)
}

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

interface GoogleProfile {
  sub: string
  email?: string
  given_name?: string
  family_name?: string
  name?: string
  picture?: string
}

export async function handleGoogleCallback(code: string, ip?: string) {
  const { data: tokenData } = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code',
  })

  const { data: profile } = await axios.get<GoogleProfile>('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  if (!profile.email) throw ApiError.badRequest('Your Google account has no email address', 'GOOGLE_NO_EMAIL')

  let user = await prisma.user.findUnique({ where: { googleId: profile.sub }, include: { role: true } })

  if (!user) {
    const existingByEmail = await prisma.user.findUnique({ where: { email: profile.email }, include: { role: true } })
    if (existingByEmail) {
      // Same email already has an account (e.g. registered with a password) -
      // link the Google identity rather than creating a duplicate.
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: { googleId: profile.sub, emailVerified: true },
        include: { role: true },
      })
    } else {
      const customerRole = await prisma.role.findUnique({ where: { name: CUSTOMER_ROLE_NAME } })
      if (!customerRole) throw new Error('CUSTOMER role is not seeded')

      // Google-only accounts never use a password, but passwordHash is required -
      // generate one they'll never know so they're forced through Google or a
      // future "forgot password" reset if they ever want password-based login.
      const passwordHash = await hashPassword(crypto.randomBytes(32).toString('hex'))

      user = await prisma.user.create({
        data: {
          email: profile.email,
          passwordHash,
          firstName: profile.given_name || profile.name || 'Google',
          lastName: profile.family_name || 'User',
          googleId: profile.sub,
          emailVerified: true,
          avatarUrl: profile.picture,
          roleId: customerRole.id,
        },
        include: { role: true },
      })
    }
  }

  if (!user.isActive) throw ApiError.unauthorized('Account is deactivated', 'ACCOUNT_DEACTIVATED')

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), lastLoginIp: ip } })
  await recordSecurityEvent({ type: 'LOGIN', userId: user.id, email: user.email, ip, detail: 'Google sign-in' })

  const authUser = toAuthUser(user)
  const tokens = await issueTokens(authUser, ip)
  return { user: authUser, ...tokens }
}

export async function changePassword(input: {
  userId: string
  currentPassword: string
  newPassword: string
  currentRefreshToken?: string
}) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: input.userId } })

  const valid = await verifyPassword(input.currentPassword, user.passwordHash)
  if (!valid) throw ApiError.unauthorized('Current password is incorrect', 'INVALID_CREDENTIALS')

  const passwordHash = await hashPassword(input.newPassword)
  const keepHash = input.currentRefreshToken ? hashRefreshToken(input.currentRefreshToken) : null

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    // Voluntary change while authenticated: revoke every OTHER session, but
    // leave the one making this request alone (unlike a forgot-password reset,
    // which revokes everything since it implies a possibly-compromised account).
    prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null, ...(keepHash ? { tokenHash: { not: keepHash } } : {}) },
      data: { revokedAt: new Date() },
    }),
  ])
}
