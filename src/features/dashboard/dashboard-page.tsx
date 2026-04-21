import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/auth-context'
import {
  canManageUsers,
  canRecordData,
  canViewReports,
} from '@/lib/permissions'
import { FinancialOverview } from './financial-overview'
import { QuickActions } from './quick-actions'
import { UserStats } from './user-stats'

export function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const showFinancial = canViewReports(user)
  const showUserStats = canManageUsers(user)
  const showQuickActions = canRecordData(user)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('nav.dashboard')}</h1>

      {showFinancial && <FinancialOverview />}
      {showUserStats && <UserStats />}
      {showQuickActions && <QuickActions />}

      {!showFinancial && !showUserStats && !showQuickActions && (
        <p className="text-muted-foreground">
          {t('dashboard.welcome', { username: user?.username })}
        </p>
      )}
    </div>
  )
}
