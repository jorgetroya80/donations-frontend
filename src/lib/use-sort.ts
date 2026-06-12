import { useState } from 'react'

export function useSort(initial: string, onSortChange?: () => void) {
  const [sort, setSort] = useState(initial)

  function toggleSort(field: string) {
    const [currentField, currentDir] = sort.split(',')
    if (currentField === field) {
      setSort(`${field},${currentDir === 'asc' ? 'desc' : 'asc'}`)
    } else {
      setSort(`${field},asc`)
    }
    onSortChange?.()
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

  return { sort, toggleSort, sortIndicator, ariaSort }
}
