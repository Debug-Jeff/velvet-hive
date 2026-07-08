import { prisma } from './prisma'

let roleIdToPermissions: Map<number, Set<string>> = new Map()
let loaded = false

async function load() {
  const rolePermissions = await prisma.rolePermission.findMany({
    include: { permission: true },
  })

  const next = new Map<number, Set<string>>()
  for (const rp of rolePermissions) {
    const set = next.get(rp.roleId) ?? new Set<string>()
    set.add(rp.permission.key)
    next.set(rp.roleId, set)
  }
  roleIdToPermissions = next
  loaded = true
}

export async function ensurePermissionsCacheLoaded() {
  if (!loaded) await load()
}

export async function refreshPermissionsCache() {
  await load()
}

export function roleHasPermission(roleId: number, permissionKey: string): boolean {
  return roleIdToPermissions.get(roleId)?.has(permissionKey) ?? false
}
