import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ChangePasswordRequest } from '@/lib/api-types'

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) =>
      api.put('users/me/password', { json: data }),
  })
}
