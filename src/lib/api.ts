import ky from 'ky'

const AUTH_STORAGE_KEY = 'auth_user'

export const api = ky.create({
  prefixUrl: '/api/v1',
  credentials: 'include',
  hooks: {
    afterResponse: [
      (_request, _options, response) => {
        if (response.status === 401) {
          localStorage.removeItem(AUTH_STORAGE_KEY)
          window.location.href = '/login'
        }
      },
    ],
  },
})
