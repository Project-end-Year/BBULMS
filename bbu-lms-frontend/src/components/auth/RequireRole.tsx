import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2, ShieldAlert } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'

export function RequireAuth() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-text-muted">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

interface RequireRoleProps {
  role: string | string[]
}

export function RequireRole({ role }: RequireRoleProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-text-muted">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const allowed = Array.isArray(role) ? role : [role]
  const hasRole = user.roles.some((r) => allowed.includes(r.name))

  if (!hasRole) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-6 text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-red-500" />
        <h1 className="mb-2 text-xl font-semibold text-text">Access denied</h1>
        <p className="mb-6 max-w-sm text-text-muted">
          You do not have permission to view this page.
        </p>
        <a
          href="/dashboard"
          className="rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue-dark"
        >
          Go to Dashboard
        </a>
      </div>
    )
  }

  return <Outlet />
}
