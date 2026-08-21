import type { ReactNode } from 'react'
import { TableHead } from '@/components/ui/table'

interface SortableThProps {
  ariaSort: 'ascending' | 'descending' | 'none'
  onSort: () => void
  indicator: string
  children: ReactNode
  className?: string
}

export function SortableTh({
  ariaSort,
  onSort,
  indicator,
  children,
  className,
}: SortableThProps) {
  return (
    <TableHead aria-sort={ariaSort} className={className}>
      <button
        type="button"
        onClick={onSort}
        className="flex cursor-pointer items-center gap-1 rounded-sm font-medium transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
      >
        {children}
        <span aria-hidden="true">{indicator}</span>
      </button>
    </TableHead>
  )
}
