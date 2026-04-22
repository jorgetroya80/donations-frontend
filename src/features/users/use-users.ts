import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  CreateUserRequest,
  PageResponse,
  UpdateUserRequest,
  UserResponse,
} from '@/lib/api-types'

interface UserListParams {
  page: number
  size: number
  sort?: string
}

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => {
      const searchParams: Record<string, string | number> = {
        page: params.page,
        size: params.size,
      }
      if (params.sort) searchParams.sort = params.sort
      return api
        .get('users', { searchParams })
        .json<PageResponse<UserResponse>>()
    },
  })
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => api.get(`users/${id}`).json<UserResponse>(),
    enabled: id > 0,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserRequest) =>
      api.post('users', { json: data }).json<UserResponse>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateUserRequest) =>
      api.put(`users/${id}`, { json: data }).json<UserResponse>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
