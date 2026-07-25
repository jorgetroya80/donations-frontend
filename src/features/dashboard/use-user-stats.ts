import { useUsers } from '@/features/users'

export function useUserStats() {
  const { data, ...rest } = useUsers({ page: 0, size: 1 })
  return {
    ...rest,
    data: data ? { totalUsers: data.page?.totalElements } : undefined,
  }
}
