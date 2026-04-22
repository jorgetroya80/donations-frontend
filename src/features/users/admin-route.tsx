import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/features/auth/auth-context'
import { canManageUsers } from '@/lib/permissions'

export function AdminRoute() {
  const { user } = useAuth()

  if (!canManageUsers(user)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
