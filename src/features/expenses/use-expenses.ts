import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  CreateExpenseRequest,
  ExpenseResponse,
  PageResponse,
  UpdateExpenseRequest,
} from '@/lib/api-types'

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
    queryFn: () => {
      const searchParams: Record<string, string | number> = {
        page: params.page,
        size: params.size,
      }
      if (params.sort) searchParams.sort = params.sort
      if (params.from) searchParams.from = params.from
      if (params.to) searchParams.to = params.to
      return api
        .get('expenses', { searchParams })
        .json<PageResponse<ExpenseResponse>>()
    },
  })
}

export function useExpense(id: number) {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: () => api.get(`expenses/${id}`).json<ExpenseResponse>(),
    enabled: id > 0,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateExpenseRequest) =>
      api.post('expenses', { json: data }).json<ExpenseResponse>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

export function useUpdateExpense(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateExpenseRequest) =>
      api.put(`expenses/${id}`, { json: data }).json<ExpenseResponse>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}
