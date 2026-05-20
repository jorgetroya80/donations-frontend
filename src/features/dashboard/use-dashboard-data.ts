import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  BalanceResponse,
  DonationSummaryResponse,
  ExpenseSummaryResponse,
} from '@/lib/api-types'

interface DateRange {
  from: string
  to: string
}

export function useBalance({ from, to }: DateRange) {
  return useQuery({
    queryKey: ['reports', 'balance', from, to],
    queryFn: ({ signal }) =>
      api
        .get('reports/balance', { searchParams: { from, to }, signal })
        .json<BalanceResponse>(),
  })
}

export function useDonationSummary({ from, to }: DateRange) {
  return useQuery({
    queryKey: ['reports', 'donations', from, to],
    queryFn: ({ signal }) =>
      api
        .get('reports/donations', { searchParams: { from, to }, signal })
        .json<DonationSummaryResponse>(),
  })
}

export function useExpenseSummary({ from, to }: DateRange) {
  return useQuery({
    queryKey: ['reports', 'expenses', from, to],
    queryFn: ({ signal }) =>
      api
        .get('reports/expenses', { searchParams: { from, to }, signal })
        .json<ExpenseSummaryResponse>(),
  })
}
