import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
        HttpResponse.json(
          {
            status: 403,
            error: 'Forbidden',
            message: 'Password change required',
            code: 'PASSWORD_CHANGE_REQUIRED',
          },
          { status: 403 }
        )
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
        HttpResponse.json(
          {
            status: 403,
            error: 'Forbidden',
            message: 'Password change required',
            code: 'PASSWORD_CHANGE_REQUIRED',
          },
          { status: 403 }
        )
      )
    )

    await kyInstance.get('http://localhost/api/v1/donations')

    const stored = JSON.parse(localStorage.getItem(AUTH_KEY)!)
    expect(stored.mustChangePassword).toBe(true)
  })

  it('leaves flag untouched on plain 403 without the code', async () => {
    server.use(
      http.get('*/api/v1/donations', () =>
        HttpResponse.json(
          { status: 403, error: 'Forbidden', message: 'Nope' },
          { status: 403 }
        )
      )
    )

    await kyInstance.get('http://localhost/api/v1/donations')

    const stored = JSON.parse(localStorage.getItem(AUTH_KEY)!)
    expect(stored.mustChangePassword).toBe(false)
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
        HttpResponse.json(
          {
            status: 403,
            error: 'Forbidden',
            message: 'Password change required',
            code: 'PASSWORD_CHANGE_REQUIRED',
          },
          { status: 403 }
        )
      )
    )

    await kyInstance.put('http://localhost/api/v1/users/me/password', {
      json: { currentPassword: 'a', newPassword: 'bbbbbbbb' },
    })

    const stored = JSON.parse(localStorage.getItem(AUTH_KEY)!)
    expect(stored.mustChangePassword).toBe(true)
  })
})
