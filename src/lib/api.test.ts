import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { problemDetailResponse } from '@/test/problem-detail'
import { server } from '@/test/msw-server'
import { kyInstance } from './api'

const AUTH_KEY = 'auth_user'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({
      username: 'admin',
      roles: ['ADMIN'],
      mustChangePassword: false,
    })
  )
})

describe('ky afterResponse hook', () => {
  it('dispatches auth:force-rotation event on 403 PASSWORD_CHANGE_REQUIRED', async () => {
    server.use(
      http.get('*/api/v1/donations', () =>
        problemDetailResponse({
          status: 403,
          title: 'Forbidden',
          detail: 'Password change required',
          instance: '/api/v1/donations',
          code: 'PASSWORD_CHANGE_REQUIRED',
        })
      )
    )
    const listener = vi.fn()
    window.addEventListener('auth:force-rotation', listener)

    await kyInstance.get('http://localhost/api/v1/donations')

    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener('auth:force-rotation', listener)
  })

  it('flips mustChangePassword to true on 403 PASSWORD_CHANGE_REQUIRED', async () => {
    server.use(
      http.get('*/api/v1/donations', () =>
        problemDetailResponse({
          status: 403,
          title: 'Forbidden',
          detail: 'Password change required',
          instance: '/api/v1/donations',
          code: 'PASSWORD_CHANGE_REQUIRED',
        })
      )
    )

    await kyInstance.get('http://localhost/api/v1/donations')

    const stored = JSON.parse(localStorage.getItem(AUTH_KEY)!)
    expect(stored.mustChangePassword).toBe(true)
  })

  it('leaves flag untouched on plain 403 without the code', async () => {
    server.use(
      http.get('*/api/v1/donations', () =>
        problemDetailResponse({
          status: 403,
          title: 'Forbidden',
          detail: 'Nope',
          instance: '/api/v1/donations',
        })
      )
    )

    await kyInstance.get('http://localhost/api/v1/donations')

    const stored = JSON.parse(localStorage.getItem(AUTH_KEY)!)
    expect(stored.mustChangePassword).toBe(false)
  })

  it('leaves flag untouched on 403 with non-JSON body', async () => {
    server.use(
      http.get('*/api/v1/donations', () =>
        HttpResponse.text('<html>not json</html>', { status: 403 })
      )
    )

    await kyInstance.get('http://localhost/api/v1/donations')

    const stored = JSON.parse(localStorage.getItem(AUTH_KEY)!)
    expect(stored.mustChangePassword).toBe(false)
  })

  it('does not run 403 logic when status is 401 (early return)', async () => {
    server.use(
      http.get(
        '*/api/v1/donations',
        () => new HttpResponse(null, { status: 401 })
      )
    )
    const listener = vi.fn()
    window.addEventListener('auth:force-rotation', listener)

    await kyInstance.get('http://localhost/api/v1/donations')

    expect(listener).not.toHaveBeenCalled()
    expect(localStorage.getItem(AUTH_KEY)).toBeNull()
    window.removeEventListener('auth:force-rotation', listener)
  })

  it('dispatches event even when already on /settings/password', async () => {
    const originalPath = window.location.pathname
    window.history.pushState({}, '', '/settings/password')
    server.use(
      http.get('*/api/v1/donations', () =>
        problemDetailResponse({
          status: 403,
          title: 'Forbidden',
          detail: 'Password change required',
          instance: '/api/v1/donations',
          code: 'PASSWORD_CHANGE_REQUIRED',
        })
      )
    )
    const listener = vi.fn()
    window.addEventListener('auth:force-rotation', listener)

    await kyInstance.get('http://localhost/api/v1/donations')

    expect(listener).toHaveBeenCalledTimes(1)
    const stored = JSON.parse(localStorage.getItem(AUTH_KEY)!)
    expect(stored.mustChangePassword).toBe(true)
    window.removeEventListener('auth:force-rotation', listener)
    window.history.pushState({}, '', originalPath)
  })

  it('ignores 403 from /users/me/password (avoid loop)', async () => {
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({
        username: 'admin',
        roles: ['ADMIN'],
        mustChangePassword: true,
      })
    )
    server.use(
      http.put('*/api/v1/users/me/password', () =>
        problemDetailResponse({
          status: 403,
          title: 'Forbidden',
          detail: 'Password change required',
          instance: '/api/v1/users/me/password',
          code: 'PASSWORD_CHANGE_REQUIRED',
        })
      )
    )

    await kyInstance.put('http://localhost/api/v1/users/me/password', {
      json: { currentPassword: 'a', newPassword: 'bbbbbbbb' },
    })

    const stored = JSON.parse(localStorage.getItem(AUTH_KEY)!)
    expect(stored.mustChangePassword).toBe(true)
  })
})
