import { api } from './client'
import type { SecurityEvent } from '../types/securityEvent'

export function listSecurityEvents() {
  return api.get<SecurityEvent[]>('/security/events')
}
