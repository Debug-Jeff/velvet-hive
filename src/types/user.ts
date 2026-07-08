export type RoleName = 'SUPER_ADMIN' | 'ADMIN' | 'ACCOUNTS' | 'INVENTORY_CLERK' | 'CUSTOMER'

export interface AuthUser {
  id: string
  roleId: number
  roleName: RoleName
  email: string
  firstName?: string
  lastName?: string
  phone?: string | null
  avatarUrl?: string | null
}

export interface StaffUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  isActive: boolean
  createdAt: string
  role: { id: number; name: RoleName }
}

export interface CreateUserInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  roleName: RoleName
}

export interface UpdateUserInput {
  firstName?: string
  lastName?: string
  phone?: string
  roleName?: RoleName
  isActive?: boolean
}
