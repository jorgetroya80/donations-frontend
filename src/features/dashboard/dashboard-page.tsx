import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/auth-context'

export function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-bold">
        {t('dashboard.welcome', { username: user?.username })}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {t('dashboard.roles', { roles: user?.roles.join(', ') })}
      </p>
    </div>
  )
}
