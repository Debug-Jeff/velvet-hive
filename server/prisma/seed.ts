import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import productsSeed from '../products-all.json'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const ROLE_NAMES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'INVENTORY_CLERK', 'CUSTOMER'] as const

const PERMISSIONS = [
  'products:read',
  'products:create',
  'products:update',
  'products:delete',
  'inventory:read',
  'inventory:adjust',
  'orders:create',
  'orders:read:own',
  'orders:read:all',
  'orders:update:status',
  'payments:read',
  'reports:financial:read',
  'reports:stock:read',
  'users:manage',
  'roles:manage',
  'chat:use',
] as const

const ROLE_PERMISSIONS: Record<(typeof ROLE_NAMES)[number], readonly string[]> = {
  SUPER_ADMIN: PERMISSIONS,
  ADMIN: [
    'products:read',
    'products:create',
    'products:update',
    'products:delete',
    'orders:read:all',
    'orders:update:status',
    'inventory:read',
    'reports:stock:read',
  ],
  ACCOUNTS: ['inventory:read', 'reports:financial:read', 'reports:stock:read', 'orders:read:all'],
  INVENTORY_CLERK: ['products:read', 'inventory:read', 'inventory:adjust'],
  CUSTOMER: ['products:read', 'orders:create', 'orders:read:own', 'chat:use'],
}

// upsert() always opens an implicit transaction, which some managed Postgres
// providers' external-connection poolers don't support cleanly (seen as
// P1017/ConnectionClosed right on the first upsert, reproduced from two
// separate networks). Plain findUnique + create/update are each a single
// non-transactional round trip, so this sidesteps the issue entirely - only
// matters for this one-off seeding script; the running app connects
// internally and already uses real transactions safely elsewhere.

async function upsertRole(name: string) {
  const existing = await prisma.role.findUnique({ where: { name } })
  if (existing) return existing
  return prisma.role.create({ data: { name } })
}

async function upsertPermission(key: string) {
  const existing = await prisma.permission.findUnique({ where: { key } })
  if (existing) return existing
  return prisma.permission.create({ data: { key } })
}

async function upsertRolePermission(roleId: number, permissionId: number) {
  const existing = await prisma.rolePermission.findUnique({ where: { roleId_permissionId: { roleId, permissionId } } })
  if (existing) return existing
  return prisma.rolePermission.create({ data: { roleId, permissionId } })
}

async function main() {
  console.log('Seeding roles & permissions...')

  const roleByName = new Map<string, number>()
  for (const name of ROLE_NAMES) {
    const role = await upsertRole(name)
    roleByName.set(name, role.id)
  }

  const permissionByKey = new Map<string, number>()
  for (const key of PERMISSIONS) {
    const permission = await upsertPermission(key)
    permissionByKey.set(key, permission.id)
  }

  for (const roleName of ROLE_NAMES) {
    const roleId = roleByName.get(roleName)!
    for (const key of ROLE_PERMISSIONS[roleName]) {
      const permissionId = permissionByKey.get(key)!
      await upsertRolePermission(roleId, permissionId)
    }
  }

  console.log('Seeding super admin user...')
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL!
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD!
  const passwordHash = await bcrypt.hash(superAdminPassword, 12)

  const existingSuperAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } })
  if (existingSuperAdmin) {
    await prisma.user.update({ where: { email: superAdminEmail }, data: { emailVerified: true } })
  } else {
    await prisma.user.create({
      data: {
        email: superAdminEmail,
        passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        roleId: roleByName.get('SUPER_ADMIN')!,
        emailVerified: true,
      },
    })
  }

  console.log(`Seeding ${productsSeed.length} products...`)
  for (const p of productsSeed as Array<{
    id: number
    name: string
    category: string
    image: string
    description: string
    price_ksh: number
  }>) {
    const sku = `SKU-${String(p.id).padStart(5, '0')}`
    const existing = await prisma.product.findUnique({ where: { sku } })
    if (existing) {
      // Re-seeding is meant to restore known-good state, including undoing any
      // isActive:false left over from testing deactivate/delete flows - so
      // update mirrors create rather than being a no-op.
      await prisma.product.update({
        where: { sku },
        data: {
          name: p.name,
          category: p.category,
          description: p.description ?? '',
          imageUrl: p.image,
          priceKes: p.price_ksh,
          isActive: true,
        },
      })
    } else {
      await prisma.product.create({
        data: {
          sku,
          name: p.name,
          category: p.category,
          description: p.description ?? '',
          imageUrl: p.image,
          priceKes: p.price_ksh,
          stockQuantity: 50,
          reorderThreshold: 10,
        },
      })
    }
  }

  console.log('Seed complete.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
