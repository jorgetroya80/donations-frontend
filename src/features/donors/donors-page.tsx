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
import { useDonors } from './use-donors'

export function DonorsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const { sort, toggleSort, sortIndicator, ariaSort } = useSort(
    'fullName,asc',
    () => setPage(0)
  )

  const { data, isLoading, error } = useDonors({ page, size: 10, sort })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader title={t('donors.title')} />
        <Button onClick={() => navigate('/donors/new')}>
          <Plus size={16} />
          {t('donors.new')}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {getProblemMessage(error, t('donors.errorLoading'))}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && <TableSkeleton />}

      {data && (data.content ?? []).length === 0 && (
        <EmptyState
          icon={<Plus size={40} />}
          message={t('donors.empty')}
          cta={{
            label: t('donors.new'),
            onClick: () => navigate('/donors/new'),
          }}
        />
      )}

      {data && (data.content ?? []).length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTh
                  ariaSort={ariaSort('fullName')}
                  onSort={() => toggleSort('fullName')}
                  indicator={sortIndicator('fullName')}
                >
                  {t('donors.fullName')}
                </SortableTh>
                <TableHead>{t('donors.nationalId')}</TableHead>
                <TableHead>{t('donors.email')}</TableHead>
                <TableHead>{t('donors.phone')}</TableHead>
                <TableHead>{t('donors.status')}</TableHead>
                <TableHead className="w-16">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.content ?? []).map((donor) => (
                <TableRow key={donor.id}>
                  <TableCell className="font-medium">
                    {donor.fullName}
                  </TableCell>
                  <TableCell>{donor.nationalId}</TableCell>
                  <TableCell>{donor.email ?? '—'}</TableCell>
                  <TableCell>{donor.phone ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={donor.active ? 'default' : 'secondary'}>
                      {donor.active ? t('donors.active') : t('donors.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/donors/${donor.id}/edit`}
                      className={buttonVariants({
                        variant: 'ghost',
                        size: 'icon',
                      })}
                      aria-label={t('donors.editLabel', {
                        name: donor.fullName,
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
              {t('donors.page', {
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
                {t('donors.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  (data.page?.number ?? 0) >= (data.page?.totalPages ?? 0) - 1
                }
                onClick={() => setPage((p) => p + 1)}
              >
                {t('donors.next')}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
