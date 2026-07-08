import crypto from 'node:crypto'
import { prisma } from '../../lib/prisma'
import { env } from '../../config/env'
import type { VerificationCodeType } from '../../generated/prisma/client'

const CODE_TTL_MS = 15 * 60 * 1000

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000))
}

function hashCode(code: string) {
  return crypto.createHmac('sha256', env.JWT_REFRESH_PEPPER).update(code).digest('hex')
}

export async function createVerificationCode(userId: string, type: VerificationCodeType) {
  // Invalidate any previous outstanding codes of this type so only the latest one works.
  await prisma.verificationCode.updateMany({
    where: { userId, type, consumedAt: null },
    data: { consumedAt: new Date() },
  })

  const code = generateOtp()
  await prisma.verificationCode.create({
    data: {
      userId,
      type,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  })

  return code
}

export async function consumeVerificationCode(userId: string, type: VerificationCodeType, rawCode: string) {
  const record = await prisma.verificationCode.findFirst({
    where: { userId, type, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) return false
  if (record.expiresAt < new Date()) return false
  if (record.codeHash !== hashCode(rawCode)) return false

  await prisma.verificationCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } })
  return true
}
