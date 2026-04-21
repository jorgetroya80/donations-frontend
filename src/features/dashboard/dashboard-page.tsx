import { useAuth } from '@/features/auth/auth-context'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Bienvenido, {user?.username}</h1>
        <p className="mt-2 text-muted-foreground">
          Roles: {user?.roles.join(', ')}
        </p>
      </div>
    </div>
  )
}
