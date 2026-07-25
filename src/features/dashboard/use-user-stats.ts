import { useUsers } from '@/features/users'

export function useUserStats() {
  const { data, isLoading, isSuccess, error } = useUsers({ page: 0, size: 1 })
  return {
    data: data ? { totalUsers: data.page?.totalElements } : undefined,
    isLoading,
    isSuccess,
    error,
  }
}
