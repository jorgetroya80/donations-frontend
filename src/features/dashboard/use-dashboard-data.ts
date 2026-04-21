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
    queryFn: () =>
      api
        .get('reports/balance', { searchParams: { from, to } })
        .json<BalanceResponse>(),
  })
}

export function useDonationSummary({ from, to }: DateRange) {
  return useQuery({
    queryKey: ['reports', 'donations', from, to],
    queryFn: () =>
      api
        .get('reports/donations', { searchParams: { from, to } })
        .json<DonationSummaryResponse>(),
  })
}

export function useExpenseSummary({ from, to }: DateRange) {
  return useQuery({
    queryKey: ['reports', 'expenses', from, to],
    queryFn: () =>
      api
        .get('reports/expenses', { searchParams: { from, to } })
        .json<ExpenseSummaryResponse>(),
  })
}
