import { HTTPError } from 'ky'
import { z } from 'zod/v4'

const apiErrorSchema = z.object({
  fields: z.record(z.string(), z.string()).optional(),
})

// ky v2 pre-parses the response body into `error.data` before throwing,
// so `error.response.json()` is unavailable — use `error.data` directly.
export function parseApiFieldErrors(err: unknown): Record<string, string> {
  if (err instanceof HTTPError) {
    const parsed = apiErrorSchema.safeParse(err.data)
    if (parsed.success && parsed.data.fields) {
      return parsed.data.fields
    }
  }
  return {}
}
