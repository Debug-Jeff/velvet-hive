import type { RoleName } from '../types/user'

export function getDefaultRouteForRole(roleName: RoleName): string {
  switch (roleName) {
    case 'SUPER_ADMIN':
      return '/dashboard'
    case 'ADMIN':
      return '/dashboard/products'
    case 'ACCOUNTS':
      return '/dashboard/reports/financial'
    case 'INVENTORY_CLERK':
      return '/dashboard/inventory'
    case 'CUSTOMER':
      return '/'
  }
}

export const STAFF_ROLES: RoleName[] = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'INVENTORY_CLERK']
