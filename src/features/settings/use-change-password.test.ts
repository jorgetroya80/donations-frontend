import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createWrapper } from '@/test/test-utils'
import { useChangePassword } from './use-change-password'

describe('useChangePassword', () => {
  it('successfully changes password', async () => {
    const { result } = renderHook(() => useChangePassword(), {
      wrapper: createWrapper(),
    })
    result.current.mutate({
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('returns error for wrong current password', async () => {
    const { result } = renderHook(() => useChangePassword(), {
      wrapper: createWrapper(),
    })
    result.current.mutate({
      currentPassword: 'wrongpassword',
      newPassword: 'newpass123',
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
