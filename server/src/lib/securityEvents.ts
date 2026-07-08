import { prisma } from './prisma'
import type { SecurityEventType } from '../generated/prisma/client'

export async function recordSecurityEvent(input: {
  type: SecurityEventType
  userId?: string
  email?: string
  ip?: string
  userAgent?: string
  detail?: string
}) {
  try {
    await prisma.securityEvent.create({ data: input })
  } catch (err) {
    // Never let audit logging break the actual auth flow.
    console.error('Failed to record security event', err)
  }
}

export function listSecurityEvents() {
  return prisma.securityEvent.findMany({
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
}
