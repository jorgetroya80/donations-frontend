import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createWrapper } from '@/test/test-utils'
import {
  useDonationReport,
  useDonorStatement,
  useExpenseReport,
} from './use-reports'

describe('useDonationReport', () => {
  it('fetches donation summary for date range', async () => {
    const { result } = renderHook(
      () => useDonationReport({ from: '2026-04-01', to: '2026-04-30' }),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.grandTotal).toBe(5000)
    expect(result.current.data?.totalsByType).toHaveLength(2)
  })
})

describe('useExpenseReport', () => {
  it('fetches expense summary for date range', async () => {
    const { result } = renderHook(
      () => useExpenseReport({ from: '2026-04-01', to: '2026-04-30' }),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.grandTotal).toBe(3000)
    expect(result.current.data?.totalsByCategory).toHaveLength(2)
  })
})

describe('useDonorStatement', () => {
  it('fetches donor statement when donorId provided', async () => {
    const { result } = renderHook(
      () => useDonorStatement(1, { from: '2026-04-01', to: '2026-04-30' }),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.donorName).toBe('Juan Pérez')
    expect(result.current.data?.donations).toHaveLength(2)
    expect(result.current.data?.total).toBe(150)
  })

  it('does not fetch when donorId is null', () => {
    const { result } = renderHook(
      () => useDonorStatement(null, { from: '2026-04-01', to: '2026-04-30' }),
      { wrapper: createWrapper() }
    )
    expect(result.current.fetchStatus).toBe('idle')
  })
})
