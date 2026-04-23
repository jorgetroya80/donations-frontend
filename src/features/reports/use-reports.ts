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
    queryFn: () =>
      api
        .get('reports/donations', { searchParams: { from, to } })
        .json<DonationSummaryResponse>(),
  })
}

export function useExpenseReport({ from, to }: DateRange) {
  return useQuery({
    queryKey: ['reports', 'expenses', from, to],
    queryFn: () =>
      api
        .get('reports/expenses', { searchParams: { from, to } })
        .json<ExpenseSummaryResponse>(),
  })
}

export function useDonorStatement(
  donorId: number | null,
  { from, to }: DateRange
) {
  return useQuery({
    queryKey: ['reports', 'donor-statement', donorId, from, to],
    queryFn: () =>
      api
        .get(`reports/donors/${donorId}/statement`, {
          searchParams: { from, to },
        })
        .json<DonorStatementResponse>(),
    enabled: donorId !== null,
  })
}
