import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  DonationSummaryResponse,
  DonorStatementResponse,
  ExpenseSummaryResponse,
} from '@/lib/api-types'

interface DateRange {
  from: string
  to: string
}

export function useDonationReport({ from, to }: DateRange) {
  return useQuery({
    queryKey: ['reports', 'donations', from, to],
    queryFn: ({ signal }) =>
      api
        .get('reports/donations', { searchParams: { from, to }, signal })
        .json<DonationSummaryResponse>(),
  })
}

export function useExpenseReport({ from, to }: DateRange) {
  return useQuery({
    queryKey: ['reports', 'expenses', from, to],
    queryFn: ({ signal }) =>
      api
        .get('reports/expenses', { searchParams: { from, to }, signal })
        .json<ExpenseSummaryResponse>(),
  })
}

export function useDonorStatement(
  donorId: number | null,
  { from, to }: DateRange
) {
  return useQuery({
    queryKey: ['reports', 'donor-statement', donorId, from, to],
    queryFn: ({ signal }) =>
      api
        .get(`reports/donors/${donorId}/statement`, {
          searchParams: { from, to },
          signal,
        })
        .json<DonorStatementResponse>(),
    enabled: donorId !== null,
  })
}
