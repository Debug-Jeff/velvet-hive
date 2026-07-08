import { api } from './client'
import type { AuthUser } from '../types/user'

interface AuthResponse {
  user: AuthUser
  accessToken: string
}

interface MessageResponse {
  message: string
}

export function register(input: { email: string; password: string; firstName: string; lastName: string; phone?: string }) {
  return api.post<{ message: string; email: string }>('/auth/register', input, { skipAuthRetry: true })
}

export function verifyEmail(input: { email: string; code: string }) {
  return api.post<AuthResponse>('/auth/verify-email', input, { skipAuthRetry: true })
}

export function resendVerification(email: string) {
  return api.post<MessageResponse>('/auth/resend-verification', { email }, { skipAuthRetry: true })
}

export function login(input: { email: string; password: string }) {
  return api.post<AuthResponse>('/auth/login', input, { skipAuthRetry: true })
}

export function forgotPassword(email: string) {
  return api.post<MessageResponse>('/auth/forgot-password', { email }, { skipAuthRetry: true })
}

export function resetPassword(input: { email: string; code: string; newPassword: string }) {
  return api.post<MessageResponse>('/auth/reset-password', input, { skipAuthRetry: true })
}

export function refresh() {
  return api.post<AuthResponse>('/auth/refresh', undefined, { skipAuthRetry: true })
}

export function logout() {
  return api.post<void>('/auth/logout', undefined, { skipAuthRetry: true })
}

export function me() {
  return api.get<{ user: AuthUser }>('/auth/me')
}

export function updateProfile(input: { firstName?: string; lastName?: string; phone?: string }) {
  return api.patch<{ user: AuthUser }>('/auth/profile', input)
}

export function changePassword(input: { currentPassword: string; newPassword: string }) {
  return api.patch<MessageResponse>('/auth/change-password', input)
}

export function uploadAvatar(file: File) {
  const formData = new FormData()
  formData.append('avatar', file)
  return api.post<{ user: AuthUser }>('/auth/avatar', formData)
}
