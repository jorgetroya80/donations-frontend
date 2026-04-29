import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useUsers } from './use-users'

export function UsersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState('username,asc')

  const { data, isLoading, error } = useUsers({
    page,
    size: 10,
    sort,
  })

  function toggleSort(field: string) {
    const [currentField, currentDir] = sort.split(',')
    if (currentField === field) {
      setSort(`${field},${currentDir === 'asc' ? 'desc' : 'asc'}`)
    } else {
      setSort(`${field},asc`)
    }
    setPage(0)
  }

  function sortIndicator(field: string) {
    const [currentField, currentDir] = sort.split(',')
    if (currentField !== field) return ''
    return currentDir === 'asc' ? ' ↑' : ' ↓'
  }

  function ariaSort(field: string): 'ascending' | 'descending' | 'none' {
    const [currentField, currentDir] = sort.split(',')
    if (currentField !== field) return 'none'
    return currentDir === 'asc' ? 'ascending' : 'descending'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('users.title')}</h1>
        <Button onClick={() => navigate('/users/new')}>
          <Plus size={16} />
          {t('users.new')}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{t('users.errorLoading')}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div
          aria-busy="true"
          aria-label={t('common.loading')}
          className="space-y-2"
        >
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      )}

      {data && data.content.length === 0 && (
        <EmptyState
          icon={<Plus size={40} />}
          message={t('users.empty')}
          cta={{ label: t('users.new'), onClick: () => navigate('/users/new') }}
        />
      )}

      {data && data.content.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort('username')}
                  tabIndex={0}
                  aria-sort={ariaSort('username')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleSort('username')
                    }
                  }}
                >
                  {t('users.username')}
                  <span aria-hidden="true">{sortIndicator('username')}</span>
                </TableHead>
                <TableHead>{t('users.roles')}</TableHead>
                <TableHead>{t('users.status')}</TableHead>
                <TableHead className="w-16">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((role) => (
                        <Badge key={role} variant="secondary">
                          {t(`users.roleNames.${role}`)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.active ? 'default' : 'destructive'}>
                      {u.active ? t('users.active') : t('users.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/users/${u.id}/edit`}
                      className={buttonVariants({
                        variant: 'ghost',
                        size: 'icon',
                      })}
                      aria-label={t('users.editLabel', {
                        username: u.username,
                      })}
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('users.page', {
                page: data.number + 1,
                total: data.totalPages,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.number === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('users.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.number >= data.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('users.next')}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
