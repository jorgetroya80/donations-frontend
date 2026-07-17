import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('h-10 animate-pulse rounded-md bg-muted', className)}
    />
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  const { t } = useTranslation()
  return (
    <div
      aria-busy="true"
      aria-label={t('common.loading')}
      className="space-y-2"
    >
      <Skeleton className="h-8 bg-muted/60" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  )
}
