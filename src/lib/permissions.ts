interface AuthUser {
  username: string
  roles: string[]
}

function hasRole(user: AuthUser | null, role: string): boolean {
  return user?.roles.includes(role) ?? false
}

export function canViewReports(user: AuthUser | null): boolean {
  return hasRole(user, 'TREASURER') || hasRole(user, 'PASTOR')
}

export function canManageUsers(user: AuthUser | null): boolean {
  return hasRole(user, 'ADMIN')
}

export function canRecordData(user: AuthUser | null): boolean {
  return (
    hasRole(user, 'OPERATOR') ||
    hasRole(user, 'TREASURER') ||
    hasRole(user, 'ADMIN')
  )
}
