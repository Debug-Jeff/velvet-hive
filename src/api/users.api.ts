import { api } from './client'
import type { CreateUserInput, StaffUser, UpdateUserInput } from '../types/user'

export function listUsers() {
  return api.get<StaffUser[]>('/users')
}

export function createUser(input: CreateUserInput) {
  return api.post<StaffUser>('/users', input)
}

export function updateUser(id: string, input: UpdateUserInput) {
  return api.put<StaffUser>(`/users/${id}`, input)
}

export function deleteUser(id: string) {
  return api.delete<void>(`/users/${id}`)
}
