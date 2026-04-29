import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'

const ROUTE_TITLE_MAP = [
  { prefix: '/donations', key: 'nav.donations' },
  { prefix: '/donors', key: 'nav.donors' },
  { prefix: '/expenses', key: 'nav.expenses' },
  { prefix: '/reports', key: 'nav.reports' },
  { prefix: '/users', key: 'nav.users' },
  { prefix: '/settings', key: 'settings.changePassword' },
  { prefix: '/', key: 'nav.dashboard' },
]

export function usePageTitle(): string {
  const { pathname } = useLocation()
  const { t } = useTranslation()

  const match = ROUTE_TITLE_MAP.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(prefix + '/')
  )

  return match ? t(match.key) : ''
}
