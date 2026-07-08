import type { RoleName } from '../types/user'

// Mirrors server/prisma/seed.ts's ROLE_PERMISSIONS matrix (also documented in
// server/API.md). No GET /api/permissions endpoint exists, so this is a
// maintained-by-hand copy - keep it in sync if the backend matrix changes.
export const ALL_PERMISSIONS = [
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

export type Permission = (typeof ALL_PERMISSIONS)[number]

export const ROLE_PERMISSIONS: Record<RoleName, readonly Permission[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
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

export function roleHasPermission(roleName: RoleName, permission: Permission): boolean {
  return ROLE_PERMISSIONS[roleName].includes(permission)
}
