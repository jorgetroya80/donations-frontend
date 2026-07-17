import { z } from 'zod/v4'

const problemSchema = z.object({
  detail: z.string().optional(),
  title: z.string().optional(),
})

/**
 * Extracts a human-readable message from an RFC 9457 ProblemDetail error
 * thrown by the API client, falling back to the given generic message.
 */
export function getProblemMessage(err: unknown, fallback: string): string {
  const parsed = problemSchema.safeParse(err)
  if (parsed.success) {
    return parsed.data.detail ?? parsed.data.title ?? fallback
  }
  return fallback
}
