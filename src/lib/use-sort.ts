import { useSearchParams } from 'react-router'

export function useSort(defaultSort: string, sortableFields: string[]) {
  const [searchParams, setSearchParams] = useSearchParams()

  const raw = searchParams.get('sort')
  const sort = raw && isValidSort(raw, sortableFields) ? raw : defaultSort

  function toggleSort(field: string) {
    const [currentField, currentDir] = sort.split(',')
    const next =
      currentField === field
        ? `${field},${currentDir === 'asc' ? 'desc' : 'asc'}`
        : `${field},asc`
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (next === defaultSort) {
          params.delete('sort')
        } else {
          params.set('sort', next)
        }
        // Changing sort restarts pagination; one atomic URL update.
        params.delete('page')
        return params
      },
      { replace: true }
    )
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

function isValidSort(value: string, sortableFields: string[]) {
  const [field = '', dir] = value.split(',')
  return sortableFields.includes(field) && (dir === 'asc' || dir === 'desc')
}
