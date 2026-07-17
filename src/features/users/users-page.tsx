import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { TableSkeleton } from '@/components/skeleton'
import { SortableTh } from '@/components/sortable-th'
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
import { getProblemMessage } from '@/lib/get-problem-message'
import { useSort } from '@/lib/use-sort'
import { useUsers } from './use-users'

export function UsersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const { sort, toggleSort, sortIndicator, ariaSort } = useSort(
    'username,asc',
    () => setPage(0)
  )

  const { data, isLoading, error } = useUsers({
    page,
    size: 10,
    sort,
  })
  const rows = data?.content ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader title={t('users.title')} />
        <Button onClick={() => navigate('/users/new')}>
          <Plus size={16} />
          {t('users.new')}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {getProblemMessage(error, t('users.errorLoading'))}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && <TableSkeleton />}

      {data && rows.length === 0 && (
        <EmptyState
          icon={<Plus size={40} />}
          message={t('users.empty')}
          cta={{ label: t('users.new'), onClick: () => navigate('/users/new') }}
        />
      )}

      {data && rows.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTh
                  ariaSort={ariaSort('username')}
                  onSort={() => toggleSort('username')}
                  indicator={sortIndicator('username')}
                >
                  {t('users.username')}
                </SortableTh>
                <TableHead>{t('users.roles')}</TableHead>
                <TableHead>{t('users.status')}</TableHead>
                <TableHead className="w-16">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(u.roles ?? []).map((role) => (
                        <Badge key={role} variant="secondary">
                          {t(`users.roleNames.${role}`)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={u.active ? 'default' : 'destructive'}>
                        {u.active ? t('users.active') : t('users.inactive')}
                      </Badge>
                      {u.mustChangePassword && (
                        <Badge variant="outline">
                          {t('users.pendingRotation')}
                        </Badge>
                      )}
                    </div>
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
                page: (data.page?.number ?? 0) + 1,
                total: data.page?.totalPages ?? 0,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={(data.page?.number ?? 0) === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('users.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  (data.page?.number ?? 0) >= (data.page?.totalPages ?? 0) - 1
                }
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
