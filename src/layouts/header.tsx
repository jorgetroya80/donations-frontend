import { KeyRound, LogOut, Menu, Moon, Sun, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/features/auth/auth-context'
import { useTheme } from '@/features/theme/theme-context'
import { usePageTitle } from './use-page-title'

interface HeaderProps {
  onMenuClick?: () => void
  menuButtonRef?: React.Ref<HTMLButtonElement>
}

export function Header({ onMenuClick, menuButtonRef }: HeaderProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const pageTitle = usePageTitle()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function handleChangePassword() {
    navigate('/settings/password')
  }

  return (
    <header className="bg-card flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-1">
        {onMenuClick && (
          <button
            ref={menuButtonRef}
            onClick={onMenuClick}
            aria-label={t('sidebar.openMenu')}
            className={buttonVariants({
              variant: 'ghost',
              size: 'icon',
              className: 'md:hidden',
            })}
          >
            <Menu size={16} />
          </button>
        )}
        <span className="text-sm font-medium">{pageTitle}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          aria-label={
            theme === 'dark'
              ? t('theme.switchToLight')
              : t('theme.switchToDark')
          }
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={buttonVariants({
              variant: 'ghost',
              size: 'lg',
              className: 'gap-2',
            })}
          >
            <User size={16} />
            <span>{user?.username}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleChangePassword}>
              <KeyRound size={16} />
              {t('auth.changePassword')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut size={16} />
              {t('auth.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
