import { HandCoins, Receipt, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'

export function QuickActions() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => navigate('/donations/new')}>
        <HandCoins size={16} />
        {t('dashboard.newDonation')}
      </Button>
      <Button variant="outline" onClick={() => navigate('/expenses/new')}>
        <Receipt size={16} />
        {t('dashboard.newExpense')}
      </Button>
      <Button variant="outline" onClick={() => navigate('/donors')}>
        <Users size={16} />
        {t('dashboard.viewDonors')}
      </Button>
    </div>
  )
}
