export interface AuthUser {
  id: string
  roleId: number
  roleName: string
  email: string
  // Only populated on HTTP response bodies (login/register/refresh/me), not on
  // req.user - requireAuth derives req.user from the JWT payload alone, which
  // deliberately doesn't carry these (keeps the token small; permission checks
  // never need a display name).
  firstName?: string
  lastName?: string
  phone?: string | null
  avatarUrl?: string | null
}

export interface AccessTokenPayload {
  sub: string
  roleId: number
  roleName: string
  email: string
}
