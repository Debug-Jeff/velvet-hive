import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { roleHasPermission, type Permission } from '../constants/permissions'
import type { RoleName } from '../types/user'
import ForbiddenPage from '../pages/ForbiddenPage'

function FullPageLoading() {
  return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>
}

export function RequireAuth() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageLoading />
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }
  return <Outlet />
}

export function RequireRole({ roles }: { roles: RoleName[] }) {
  const { user, isLoading } = useAuth()
  if (isLoading || !user) return <FullPageLoading />
  if (!roles.includes(user.roleName)) return <ForbiddenPage />
  return <Outlet />
}

export function RequirePermission({ permission }: { permission: Permission }) {
  const { user, isLoading } = useAuth()
  if (isLoading || !user) return <FullPageLoading />
  if (!roleHasPermission(user.roleName, permission)) return <ForbiddenPage />
  return <Outlet />
}
