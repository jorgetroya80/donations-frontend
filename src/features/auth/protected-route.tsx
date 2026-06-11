import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './auth-context'

const CHANGE_PASSWORD_PATH = '/settings/password'

export function ProtectedRoute() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.mustChangePassword && location.pathname !== CHANGE_PASSWORD_PATH) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />
  }

  return <Outlet />
}
