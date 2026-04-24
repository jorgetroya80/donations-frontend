import {
  ChevronLeft,
  ChevronRight,
  Church,
  HandCoins,
  Home,
  LayoutDashboard,
  Receipt,
  Users,
  UsersRound,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuth } from '@/features/auth/auth-context'
import {
  canManageUsers,
  canRecordData,
  canViewReports,
} from '@/lib/permissions'
import { cn } from '@/lib/utils'

const SIDEBAR_KEY = 'sidebar_collapsed'

function getStoredCollapsed(): boolean {
  return localStorage.getItem(SIDEBAR_KEY) === 'true'
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface NavItem {
  to: string
  labelKey: string
  icon: React.ReactNode
  visible?: (user: { username: string; roles: string[] } | null) => boolean
}

const navItems: NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: <Home size={20} /> },
  {
    to: '/donations',
    labelKey: 'nav.donations',
    icon: <HandCoins size={20} />,
    visible: canRecordData,
  },
  {
    to: '/donors',
    labelKey: 'nav.donors',
    icon: <UsersRound size={20} />,
    visible: canRecordData,
  },
  {
    to: '/expenses',
    labelKey: 'nav.expenses',
    icon: <Receipt size={20} />,
    visible: canRecordData,
  },
  {
    to: '/reports',
    labelKey: 'nav.reports',
    icon: <LayoutDashboard size={20} />,
    visible: canViewReports,
  },
  {
    to: '/users',
    labelKey: 'nav.users',
    icon: <Users size={20} />,
    visible: canManageUsers,
  },
]

export { getStoredCollapsed, SIDEBAR_KEY }

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <aside
      className={cn(
        'bg-card flex h-screen flex-col border-r transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div
        className={cn(
          'flex h-14 items-center border-b px-3',
          collapsed ? 'justify-center' : 'gap-2'
        )}
      >
        <Church size={24} className="text-primary shrink-0" />
        {!collapsed && (
          <span className="truncate font-semibold">{t('app.name')}</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          if (item.visible && !item.visible(user)) return null

          const link = (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground',
                  collapsed && 'justify-center px-0'
                )
              }
            >
              {item.icon}
              {!collapsed && <span>{t(item.labelKey)}</span>}
            </NavLink>
          )

          if (collapsed) {
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger>{link}</TooltipTrigger>
                <TooltipContent side="right">{t(item.labelKey)}</TooltipContent>
              </Tooltip>
            )
          }

          return link
        })}
      </nav>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={onToggle}
          aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>
    </aside>
  )
}
