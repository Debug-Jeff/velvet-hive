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

async function main() {
  console.log('Seeding roles & permissions...')

  const roleByName = new Map<string, number>()
  for (const name of ROLE_NAMES) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    roleByName.set(name, role.id)
  }

  const permissionByKey = new Map<string, number>()
  for (const key of PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key },
    })
    permissionByKey.set(key, permission.id)
  }

  for (const roleName of ROLE_NAMES) {
    const roleId = roleByName.get(roleName)!
    for (const key of ROLE_PERMISSIONS[roleName]) {
      const permissionId = permissionByKey.get(key)!
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      })
    }
  }

  console.log('Seeding super admin user...')
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL!
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD!
  const passwordHash = await bcrypt.hash(superAdminPassword, 12)

  await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: { emailVerified: true },
    create: {
      email: superAdminEmail,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      roleId: roleByName.get('SUPER_ADMIN')!,
      emailVerified: true,
    },
  })

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
    await prisma.product.upsert({
      where: { sku },
      // Re-seeding is meant to restore known-good state, including undoing any
      // isActive:false left over from testing deactivate/delete flows - so update
      // mirrors create rather than being a no-op.
      update: {
        name: p.name,
        category: p.category,
        description: p.description ?? '',
        imageUrl: p.image,
        priceKes: p.price_ksh,
        isActive: true,
      },
      create: {
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
