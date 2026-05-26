import {
  type CreateExpenseRequest,
  createExpense,
  getExpense,
  listExpenses,
  type UpdateExpenseRequest,
  updateExpense,
} from '@jorgetroya80/donations-api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { client, pageableQuerySerializer } from '@/lib/api'

interface ExpenseListParams {
  page: number
  size: number
  sort?: string
  from?: string
  to?: string
}

export function useExpenses(params: ExpenseListParams) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: ({ signal }) =>
      listExpenses({
        query: {
          from: params.from,
          to: params.to,
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

export function useExpense(id: number) {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: ({ signal }) =>
      getExpense({ path: { id }, client, throwOnError: true, signal }).then(
        ({ data }) => data
      ),
    enabled: id > 0,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateExpenseRequest) =>
      createExpense({ body, client, throwOnError: true }).then(
        ({ data }) => data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

export function useUpdateExpense(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateExpenseRequest) =>
      updateExpense({ path: { id }, body, client, throwOnError: true }).then(
        ({ data }) => data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}
