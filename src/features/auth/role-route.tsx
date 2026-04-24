import { Navigate, Outlet } from 'react-router'
import { useAuth } from './auth-context'

interface RoleRouteProps {
  check: (user: { username: string; roles: string[] } | null) => boolean
}

export function RoleRoute({ check }: RoleRouteProps) {
  const { user } = useAuth()

  if (!check(user)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
