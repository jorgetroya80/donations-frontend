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
import { useDonors } from './use-donors'

export function DonorsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState('fullName,asc')

  const { data, isLoading, error } = useDonors({ page, size: 10, sort })

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
        <h1 className="text-2xl font-bold">{t('donors.title')}</h1>
        <Button onClick={() => navigate('/donors/new')}>
          <Plus size={16} />
          {t('donors.new')}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{t('donors.errorLoading')}</AlertDescription>
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
          message={t('donors.empty')}
          cta={{
            label: t('donors.new'),
            onClick: () => navigate('/donors/new'),
          }}
        />
      )}

      {data && data.content.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort('fullName')}
                  tabIndex={0}
                  aria-sort={ariaSort('fullName')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleSort('fullName')
                    }
                  }}
                >
                  {t('donors.fullName')}
                  <span aria-hidden="true">{sortIndicator('fullName')}</span>
                </TableHead>
                <TableHead>{t('donors.dniNie')}</TableHead>
                <TableHead>{t('donors.email')}</TableHead>
                <TableHead>{t('donors.phone')}</TableHead>
                <TableHead>{t('donors.status')}</TableHead>
                <TableHead className="w-16">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((donor) => (
                <TableRow key={donor.id}>
                  <TableCell className="font-medium">
                    {donor.fullName}
                  </TableCell>
                  <TableCell>{donor.dniNie}</TableCell>
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
                {t('donors.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.number >= data.totalPages - 1}
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
