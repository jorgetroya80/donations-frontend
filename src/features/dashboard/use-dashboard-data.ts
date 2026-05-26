import {
  balance,
  donationSummary,
  expenseSummary,
} from '@jorgetroya80/donations-api-client'
import { useQuery } from '@tanstack/react-query'
import { client } from '@/lib/api'

interface DateRange {
  from: string
  to: string
}

export function useBalance({ from, to }: DateRange) {
  return useQuery({
    queryKey: ['reports', 'balance', from, to],
    queryFn: ({ signal }) =>
      balance({ query: { from, to }, client, throwOnError: true, signal }).then(
        ({ data }) => data
      ),
  })
}

export function useDonationSummary({ from, to }: DateRange) {
  return useQuery({
    queryKey: ['reports', 'donations', from, to],
    queryFn: ({ signal }) =>
      donationSummary({
        query: { from, to },
        client,
        throwOnError: true,
        signal,
      }).then(({ data }) => data),
  })
}

export function useExpenseSummary({ from, to }: DateRange) {
  return useQuery({
    queryKey: ['reports', 'expenses', from, to],
    queryFn: ({ signal }) =>
      expenseSummary({
        query: { from, to },
        client,
        throwOnError: true,
        signal,
      }).then(({ data }) => data),
  })
}
