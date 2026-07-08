import { z } from 'zod'

export const idParamSchema = z.object({
  id: z.string().min(1),
})

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  roleName: z.enum(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'INVENTORY_CLERK', 'CUSTOMER']),
})

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  roleName: z.enum(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'INVENTORY_CLERK', 'CUSTOMER']).optional(),
  isActive: z.boolean().optional(),
})
