import type { ReactNode } from 'react'

import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface SortableThProps {
  ariaSort: 'ascending' | 'descending' | 'none'
  onSort: () => void
  indicator: string
  children: ReactNode
  className?: string
  align?: 'left' | 'right'
}

export function SortableTh({
  ariaSort,
  onSort,
  indicator,
  children,
  className,
  align = 'left',
}: SortableThProps) {
  const right = align === 'right'
  return (
    <TableHead
      aria-sort={ariaSort}
      className={cn(right && 'text-right', className)}
    >
      <button
        type="button"
        onClick={onSort}
        className={cn(
          'flex cursor-pointer items-center gap-1 rounded-sm font-medium transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring',
          right && 'ml-auto justify-end'
        )}
      >
        {children}
        <span aria-hidden="true">{indicator}</span>
      </button>
    </TableHead>
  )
}
