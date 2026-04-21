import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PageResponse, UserResponse } from '@/lib/api-types'

export function useUserStats() {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const page = await api
        .get('users', { searchParams: { page: 0, size: 1 } })
        .json<PageResponse<UserResponse>>()
      return { totalUsers: page.totalElements }
    },
  })
}
