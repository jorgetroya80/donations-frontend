import { z } from 'zod/v4'
import i18n from '@/lib/i18n'

const problemSchema = z.object({
  detail: z.string().optional(),
  title: z.string().optional(),
  status: z.number().optional(),
  requestId: z.string().optional(),
  fields: z.record(z.string(), z.string()).optional(),
})

/**
 * Extracts a human-readable message from an RFC 9457 ProblemDetail error
 * thrown by the API client, falling back to the given generic message.
 *
 * On a 5xx, or a 400 without field errors, the API's `requestId` is appended,
 * so the user can quote it and support can find the request in the logs. A 400
 * with field errors is shown under each input and needs no support.
 */
export function getProblemMessage(err: unknown, fallback: string): string {
  const parsed = problemSchema.safeParse(err)
  if (!parsed.success) return fallback

  const { detail, title, status, requestId, fields } = parsed.data
  const message = detail ?? title ?? fallback
  const needsSupport =
    status !== undefined && (status >= 500 || (status === 400 && !fields))
  if (requestId && needsSupport) {
    return i18n.t('errors.withReference', { message, requestId })
  }
  return message
}
