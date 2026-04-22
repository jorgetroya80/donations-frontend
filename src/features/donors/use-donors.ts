import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  CreateDonorRequest,
  DonorResponse,
  PageResponse,
  UpdateDonorRequest,
} from '@/lib/api-types'

interface DonorListParams {
  page: number
  size: number
  sort?: string
}

export function useDonors(params: DonorListParams) {
  return useQuery({
    queryKey: ['donors', params],
    queryFn: () => {
      const searchParams: Record<string, string | number> = {
        page: params.page,
        size: params.size,
      }
      if (params.sort) searchParams.sort = params.sort
      return api
        .get('donors', { searchParams })
        .json<PageResponse<DonorResponse>>()
    },
  })
}

export function useDonor(id: number) {
  return useQuery({
    queryKey: ['donors', id],
    queryFn: () => api.get(`donors/${id}`).json<DonorResponse>(),
    enabled: id > 0,
  })
}

export function useCreateDonor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDonorRequest) =>
      api.post('donors', { json: data }).json<DonorResponse>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] })
    },
  })
}

export function useUpdateDonor(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateDonorRequest) =>
      api.put(`donors/${id}`, { json: data }).json<DonorResponse>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] })
    },
  })
}
