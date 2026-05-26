import { useQuery } from '@tanstack/react-query'
import {
  donationSummary,
  donorStatement,
  expenseSummary,
} from '@jorgetroya80/donations-api-client'
import { client } from '@/lib/api'

interface DateRange {
  from: string
  to: string
}

export function useDonationReport({ from, to }: DateRange) {
  return useQuery({
    queryKey: ['reports', 'donations', from, to],
    queryFn: ({ signal }) =>
      donationSummary({ query: { from, to }, client, throwOnError: true, signal }).then(({ data }) => data),
  })
}

export function useExpenseReport({ from, to }: DateRange) {
  return useQuery({
    queryKey: ['reports', 'expenses', from, to],
    queryFn: ({ signal }) =>
      expenseSummary({ query: { from, to }, client, throwOnError: true, signal }).then(({ data }) => data),
  })
}

export function useDonorStatement(
  donorId: number | null,
  { from, to }: DateRange
) {
  return useQuery({
    queryKey: ['reports', 'donor-statement', donorId, from, to],
    queryFn: ({ signal }) =>
      donorStatement({ path: { id: donorId! }, query: { from, to }, client, throwOnError: true, signal }).then(({ data }) => data),
    enabled: donorId !== null,
  })
}
