import { Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserStats } from './use-user-stats'

export function UserStats() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data, isLoading, error } = useUserStats()

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t('dashboard.userManagement')}</h2>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{t('dashboard.errorLoading')}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.totalUsers')}
          </CardTitle>
          <Users size={16} className="text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {isLoading ? '...' : (data?.totalUsers ?? '—')}
          </p>
          <Button
            variant="link"
            className="mt-2 h-auto p-0"
            onClick={() => navigate('/users')}
          >
            {t('dashboard.manageUsers')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
