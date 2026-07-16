import { HttpResponse } from 'msw'

type ProblemDetail = {
  status: number
  title: string
  detail: string
  instance: string
} & Record<string, unknown>

export function problemDetailResponse({
  status,
  title,
  detail,
  instance,
  ...extensions
}: ProblemDetail) {
  return HttpResponse.json(
    { type: 'about:blank', title, status, detail, instance, ...extensions },
    { status, headers: { 'Content-Type': 'application/problem+json' } }
  )
}
