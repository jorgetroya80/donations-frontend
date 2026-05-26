import { createClient } from '@jorgetroya80/donations-api-client'
import ky from 'ky'

const AUTH_STORAGE_KEY = 'auth_user'

const ORIGIN =
  typeof document !== 'undefined'
    ? window.location.origin
    : 'http://localhost:3000'

const kyInstance = ky.create({
  credentials: 'include',
  throwHttpErrors: false,
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
