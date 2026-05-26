import {
  type CreateUserRequest,
  createUser,
  getUser,
  listUsers,
  type UpdateUserRequest,
  updateUser,
} from '@jorgetroya80/donations-api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { client, pageableQuerySerializer } from '@/lib/api'

interface UserListParams {
  page: number
  size: number
  sort?: string
}

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: ({ signal }) =>
      listUsers({
        query: {
          pageable: {
            page: params.page,
            size: params.size,
            sort: params.sort ? [params.sort] : undefined,
          },
        },
        client,
        throwOnError: true,
        signal,
        querySerializer: pageableQuerySerializer,
      }).then(({ data }) => data),
  })
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: ({ signal }) =>
      getUser({ path: { id }, client, throwOnError: true, signal }).then(
        ({ data }) => data
      ),
    enabled: id > 0,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateUserRequest) =>
      createUser({ body, client, throwOnError: true }).then(({ data }) => data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateUserRequest) =>
      updateUser({ path: { id }, body, client, throwOnError: true }).then(
        ({ data }) => data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
