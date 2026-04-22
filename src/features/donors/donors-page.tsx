import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
        <Alert>
          <AlertDescription>{t('common.loading')}</AlertDescription>
        </Alert>
      )}

      {data && data.content.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          {t('donors.empty')}
        </p>
      )}

      {data && data.content.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort('fullName')}
                >
                  {t('donors.fullName')}
                  {sortIndicator('fullName')}
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
                    <Link to={`/donors/${donor.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Pencil size={14} />
                      </Button>
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
