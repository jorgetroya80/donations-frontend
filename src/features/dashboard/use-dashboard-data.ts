import { balance } from '@jorgetroya80/donations-api-client'
import { useQuery } from '@tanstack/react-query'
import { client } from '@/lib/api'

interface DateRange {
  from: string
  to: string
}

// balance is dashboard-specific (reports has no balance view), so it lives here
// under the dashboard cache namespace. The donation/expense summaries are owned
// by the reports feature — import them from '@/features/reports'.
export function useBalance({ from, to }: DateRange) {
  return useQuery({
    queryKey: ['dashboard', 'balance', from, to],
    queryFn: ({ signal }) =>
      balance({ query: { from, to }, client, throwOnError: true, signal }).then(
        ({ data }) => data
      ),
  })
}
