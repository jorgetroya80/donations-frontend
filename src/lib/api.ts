import ky from 'ky'

const AUTH_STORAGE_KEY = 'auth_user'

export const api = ky.create({
  prefix: `${typeof document !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/v1`,
  credentials: 'include',
  hooks: {
    afterResponse: [
      ({ request, response }) => {
        if (response.status === 401 && !request.url.includes('/login')) {
          localStorage.removeItem(AUTH_STORAGE_KEY)
          window.location.href = '/login'
        }
      },
    ],
  },
})
