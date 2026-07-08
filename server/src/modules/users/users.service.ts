import { prisma } from '../../lib/prisma'
import { ApiError } from '../../lib/apiError'
import { hashPassword } from '../auth/password'

const userListSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  isActive: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
} as const

export function listUsers() {
  return prisma.user.findMany({ select: userListSelect, orderBy: { createdAt: 'desc' } })
}

async function resolveRoleId(roleName: string) {
  const role = await prisma.role.findUnique({ where: { name: roleName } })
  if (!role) throw ApiError.badRequest(`Unknown role: ${roleName}`)
  return role.id
}

export async function createUser(input: {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  roleName: string
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN')

  const roleId = await resolveRoleId(input.roleName)
  const passwordHash = await hashPassword(input.password)

  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      roleId,
      // Staff accounts are created directly by a Super Admin (a trusted path),
      // unlike public self-registration, so there's no email loop to close here.
      emailVerified: true,
    },
    select: userListSelect,
  })
}

export async function updateUser(
  id: string,
  input: { firstName?: string; lastName?: string; phone?: string; roleName?: string; isActive?: boolean },
) {
  const roleId = input.roleName ? await resolveRoleId(input.roleName) : undefined

  return prisma.user.update({
    where: { id },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      isActive: input.isActive,
      roleId,
    },
    select: userListSelect,
  })
}

export async function deleteUser(id: string) {
  const [orderCount, movementCount] = await Promise.all([
    prisma.order.count({ where: { userId: id } }),
    prisma.inventoryMovement.count({ where: { performedByUserId: id } }),
  ])

  if (orderCount > 0 || movementCount > 0) {
    throw ApiError.conflict(
      'This account has order or inventory history and cannot be deleted - deactivate it instead.',
      'USER_HAS_HISTORY',
    )
  }

  await prisma.user.delete({ where: { id } })
}
