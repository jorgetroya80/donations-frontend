import { KeyRound, LogOut, User } from 'lucide-react'
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

export function Header() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function handleChangePassword() {
    navigate('/settings/password')
  }

  return (
    <header className="bg-card flex h-14 items-center justify-end border-b px-4">
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
    </header>
  )
}
