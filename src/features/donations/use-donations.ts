import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  CreateDonationRequest,
  DonationCreateResponse,
  DonationResponse,
  DonorResponse,
  PageResponse,
  UpdateDonationRequest,
} from '@/lib/api-types'

interface DonationListParams {
  page: number
  size: number
  sort?: string
  from?: string
  to?: string
}

export function useDonations(params: DonationListParams) {
  return useQuery({
    queryKey: ['donations', params],
    queryFn: () => {
      const searchParams: Record<string, string | number> = {
        page: params.page,
        size: params.size,
      }
      if (params.sort) searchParams.sort = params.sort
      if (params.from) searchParams.from = params.from
      if (params.to) searchParams.to = params.to
      return api
        .get('donations', { searchParams })
        .json<PageResponse<DonationResponse>>()
    },
  })
}

export function useDonation(id: number) {
  return useQuery({
    queryKey: ['donations', id],
    queryFn: () => api.get(`donations/${id}`).json<DonationResponse>(),
    enabled: id > 0,
  })
}

export function useCreateDonation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDonationRequest) =>
      api.post('donations', { json: data }).json<DonationCreateResponse>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] })
    },
  })
}

export function useUpdateDonation(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateDonationRequest) =>
      api.put(`donations/${id}`, { json: data }).json<DonationResponse>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] })
    },
  })
}

export function useDonors() {
  return useQuery({
    queryKey: ['donors'],
    queryFn: () =>
      api
        .get('donors', {
          searchParams: { page: 0, size: 100, sort: 'fullName,asc' },
        })
        .json<PageResponse<DonorResponse>>(),
  })
}
