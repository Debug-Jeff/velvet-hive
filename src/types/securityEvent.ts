export type SecurityEventType = 'LOGIN' | 'LOGIN_FAILED' | 'LOGOUT' | 'SUSPICIOUS_LOGIN'

export interface SecurityEvent {
  id: string
  type: SecurityEventType
  userId: string | null
  user: { id: string; firstName: string; lastName: string; email: string } | null
  email: string | null
  ip: string | null
  userAgent: string | null
  detail: string | null
  createdAt: string
}
