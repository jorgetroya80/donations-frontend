import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDonor,
  getDonor,
  listDonors,
  updateDonor,
  type CreateDonorRequest,
  type UpdateDonorRequest,
} from '@jorgetroya80/donations-api-client'
import { client, pageableQuerySerializer } from '@/lib/api'

interface DonorListParams {
  page: number
  size: number
  sort?: string
}

export function useDonors(params: DonorListParams) {
  return useQuery({
    queryKey: ['donors', params],
    queryFn: ({ signal }) =>
      listDonors({
        query: { pageable: { page: params.page, size: params.size, sort: params.sort ? [params.sort] : undefined } },
        client,
        throwOnError: true,
        signal,
        querySerializer: pageableQuerySerializer,
      }).then(({ data }) => data),
  })
}

export function useDonor(id: number) {
  return useQuery({
    queryKey: ['donors', id],
    queryFn: ({ signal }) =>
      getDonor({ path: { id }, client, throwOnError: true, signal }).then(({ data }) => data),
    enabled: id > 0,
  })
}

export function useCreateDonor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateDonorRequest) =>
      createDonor({ body, client, throwOnError: true }).then(({ data }) => data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] })
    },
  })
}

export function useUpdateDonor(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateDonorRequest) =>
      updateDonor({ path: { id }, body, client, throwOnError: true }).then(({ data }) => data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] })
    },
  })
}
