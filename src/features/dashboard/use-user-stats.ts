import { useQuery } from '@tanstack/react-query'
import { listUsers } from '@jorgetroya80/donations-api-client'
import { client, pageableQuerySerializer } from '@/lib/api'

export function useUserStats() {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const { data } = await listUsers({
        query: { pageable: { page: 0, size: 1 } },
        client,
        throwOnError: true,
        querySerializer: pageableQuerySerializer,
      })
      return { totalUsers: data.totalElements }
    },
  })
}
