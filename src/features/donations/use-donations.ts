import {
  type CreateDonationRequest,
  createDonation,
  getDonation,
  listDonations,
  listDonors,
  type UpdateDonationRequest,
  updateDonation,
} from '@jorgetroya80/donations-api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { client, pageableQuerySerializer } from '@/lib/api'

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
    queryFn: ({ signal }) =>
      listDonations({
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

export function useDonation(id: number) {
  return useQuery({
    queryKey: ['donations', id],
    queryFn: ({ signal }) =>
      getDonation({ path: { id }, client, throwOnError: true, signal }).then(
        ({ data }) => data
      ),
    enabled: id > 0,
  })
}

export function useCreateDonation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateDonationRequest) =>
      createDonation({ body, client, throwOnError: true }).then(
        ({ data }) => data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] })
    },
  })
}

export function useUpdateDonation(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateDonationRequest) =>
      updateDonation({ path: { id }, body, client, throwOnError: true }).then(
        ({ data }) => data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] })
    },
  })
}

export function useDonors() {
  return useQuery({
    queryKey: ['donors'],
    queryFn: ({ signal }) =>
      listDonors({
        query: { pageable: { page: 0, size: 100, sort: ['fullName,asc'] } },
        client,
        throwOnError: true,
        signal,
        querySerializer: pageableQuerySerializer,
      }).then(({ data }) => data),
  })
}
