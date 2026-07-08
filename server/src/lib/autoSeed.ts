import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { env } from '../config/env'

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

type SeedProduct = {
  id: number
  name: string
  category: string
  image: string
  description: string
  price_ksh: number
}

// Read via fs instead of a static JSON import - avoids relying on
// TypeScript's compiled-output path matching the source layout (dist/
// inserts a directory level that a static relative import wouldn't resolve
// correctly). products-all.json is copied to /app/ by the Dockerfile.
function loadProductsSeed(): SeedProduct[] {
  const file = path.join(__dirname, '../../../products-all.json')
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

/**
 * Runs once at boot, only if the products table is empty. Exists because
 * seeding this app's data from an external connection to Render's managed
 * Postgres reliably fails (every Prisma Client query - not just upsert -
 * gets P1017 ConnectionClosed on that path), while this same app's own
 * queries succeed fine over Render's internal network. Running the seed
 * logic from inside the already-connected app sidesteps the issue entirely.
 */
export async function autoSeedIfEmpty() {
  try {
    const productCount = await prisma.product.count()
    if (productCount > 0) return

    console.log('[autoSeed] Products table is empty - seeding roles, permissions, super admin, and products...')

    const roleByName = new Map<string, number>()
    for (const name of ROLE_NAMES) {
      const existing = await prisma.role.findUnique({ where: { name } })
      const role = existing ?? (await prisma.role.create({ data: { name } }))
      roleByName.set(name, role.id)
    }

    const permissionByKey = new Map<string, number>()
    for (const key of PERMISSIONS) {
      const existing = await prisma.permission.findUnique({ where: { key } })
      const permission = existing ?? (await prisma.permission.create({ data: { key } }))
      permissionByKey.set(key, permission.id)
    }

    for (const roleName of ROLE_NAMES) {
      const roleId = roleByName.get(roleName)!
      for (const key of ROLE_PERMISSIONS[roleName]) {
        const permissionId = permissionByKey.get(key)!
        const existing = await prisma.rolePermission.findUnique({
          where: { roleId_permissionId: { roleId, permissionId } },
        })
        if (!existing) {
          await prisma.rolePermission.create({ data: { roleId, permissionId } })
        }
      }
    }

    const existingSuperAdmin = await prisma.user.findUnique({ where: { email: env.SUPER_ADMIN_EMAIL } })
    if (!existingSuperAdmin) {
      const passwordHash = await bcrypt.hash(env.SUPER_ADMIN_PASSWORD, 12)
      await prisma.user.create({
        data: {
          email: env.SUPER_ADMIN_EMAIL,
          passwordHash,
          firstName: 'Super',
          lastName: 'Admin',
          roleId: roleByName.get('SUPER_ADMIN')!,
          emailVerified: true,
        },
      })
    }

    const productsSeed = loadProductsSeed()
    for (const p of productsSeed) {
      const sku = `SKU-${String(p.id).padStart(5, '0')}`
      const existing = await prisma.product.findUnique({ where: { sku } })
      if (!existing) {
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

    console.log(`[autoSeed] Seed complete - ${productsSeed.length} products.`)
  } catch (err) {
    console.error('[autoSeed] Failed - app will continue running, but data may be incomplete:', err)
  }
}
