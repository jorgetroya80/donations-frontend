import { z } from 'zod/v4'

const apiErrorSchema = z.object({
  fields: z.record(z.string(), z.string()).optional(),
})

export function parseApiFieldErrors(err: unknown): Record<string, string> {
  const parsed = apiErrorSchema.safeParse(err)
  if (parsed.success && parsed.data.fields) return parsed.data.fields
  return {}
}
