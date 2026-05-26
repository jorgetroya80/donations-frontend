import {
  type ChangePasswordRequest,
  changeOwnPassword,
} from '@jorgetroya80/donations-api-client'
import { useMutation } from '@tanstack/react-query'
import { client } from '@/lib/api'

export function useChangePassword() {
  return useMutation({
    mutationFn: async (body: ChangePasswordRequest) => {
      const { error, response } = await changeOwnPassword({ body, client })
      if (error)
        throw Object.assign(new Error('Password change failed'), {
          status: response?.status,
        })
    },
  })
}
