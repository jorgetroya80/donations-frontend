import { createClient } from '@jorgetroya80/donations-api-client'
import ky from 'ky'
import { FORCE_ROTATION_EVENT } from '@/features/auth/auth-context'

const AUTH_STORAGE_KEY = 'auth_user'
const CHANGE_PASSWORD_PATH = '/settings/password'
const LOGIN_API_PATH = '/api/v1/login'
const CHANGE_PASSWORD_API_PATH = '/api/v1/users/me/password'

const ORIGIN =
  typeof document !== 'undefined'
    ? window.location.origin
    : 'http://localhost:3000'

function flagStoredUserForRotation() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ ...parsed, mustChangePassword: true })
    )
  } catch {
    // corrupted payload — leave alone
  }
}

async function isPasswordChangeRequired(response: Response): Promise<boolean> {
  try {
    const body = (await response.clone().json()) as { code?: string }
    return body.code === 'PASSWORD_CHANGE_REQUIRED'
  } catch {
    return false
  }
}

export const kyInstance = ky.create({
  credentials: 'include',
  throwHttpErrors: false,
  hooks: {
    afterResponse: [
      async ({ request, response }) => {
        const requestPath = new URL(request.url).pathname
        if (response.status === 401 && requestPath !== LOGIN_API_PATH) {
          localStorage.removeItem(AUTH_STORAGE_KEY)
          window.location.href = '/login'
          return
        }
        if (
          response.status === 403 &&
          requestPath !== CHANGE_PASSWORD_API_PATH &&
          (await isPasswordChangeRequired(response))
        ) {
          flagStoredUserForRotation()
          window.dispatchEvent(new Event(FORCE_ROTATION_EVENT))
          if (window.location.pathname !== CHANGE_PASSWORD_PATH) {
            window.location.href = CHANGE_PASSWORD_PATH
          }
        }
      },
    ],
  },
})

export const client = createClient({
  baseUrl: ORIGIN,
  fetch: kyInstance as typeof fetch,
})

// hey-api's deepObject serializer throws on arrays nested inside objects (e.g. pageable.sort).
// This flattens Spring Pageable + optional from/to into flat query params the backend expects.
export function pageableQuerySerializer(q: unknown): string {
  const query = q as {
    from?: string
    to?: string
    pageable?: { page?: number; size?: number; sort?: string[] }
  }
  const parts: string[] = []
  if (query.from) parts.push(`from=${query.from}`)
  if (query.to) parts.push(`to=${query.to}`)
  const { page, size, sort } = query.pageable ?? {}
  if (page !== undefined) parts.push(`page=${page}`)
  if (size !== undefined) parts.push(`size=${size}`)
  for (const s of sort ?? []) parts.push(`sort=${encodeURIComponent(s)}`)
  return parts.join('&')
}
