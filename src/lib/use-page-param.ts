import { useSearchParams } from 'react-router'

// URL param is 1-based (matches the visible "Page N of M" label);
// internal state is 0-based (matches the API). Page 1 has no param.
export function usePageParam() {
  const [searchParams, setSearchParams] = useSearchParams()

  const raw = searchParams.get('page')
  const parsed = raw === null ? Number.NaN : Number(raw)
  const page = Number.isInteger(parsed) && parsed >= 2 ? parsed - 1 : 0

  function setPage(next: number) {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (next <= 0) {
          params.delete('page')
        } else {
          params.set('page', String(next + 1))
        }
        return params
      },
      { replace: true }
    )
  }

  return { page, setPage }
}
