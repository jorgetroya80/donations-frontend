import { HTTPError } from 'ky'
import { describe, expect, it } from 'vitest'
import { parseApiFieldErrors } from './parse-api-field-errors'

// ky v2 pre-parses the response body into error.data before throwing.
// Tests mirror that behavior by setting error.data directly.
function makeHTTPError(data: unknown): HTTPError {
  const err = new HTTPError(
    new Response(null, { status: 400 }),
    new Request('http://localhost'),
    {} as never
  )
  err.data = data
  return err
}

describe('parseApiFieldErrors', () => {
  it('returns fields from a validation error', () => {
    const err = makeHTTPError({ fields: { nationalId: 'Invalid format' } })
    expect(parseApiFieldErrors(err)).toEqual({ nationalId: 'Invalid format' })
  })

  it('returns empty object for non-HTTPError', () => {
    expect(parseApiFieldErrors(new Error('oops'))).toEqual({})
  })

  it('returns empty object when data has no fields property', () => {
    const err = makeHTTPError({ message: 'Internal server error' })
    expect(parseApiFieldErrors(err)).toEqual({})
  })

  it('returns empty object when data is undefined', () => {
    const err = makeHTTPError(undefined)
    expect(parseApiFieldErrors(err)).toEqual({})
  })

  it('handles multiple field errors', () => {
    const err = makeHTTPError({
      fields: { fullName: 'Required', nationalId: 'Invalid format' },
    })
    expect(parseApiFieldErrors(err)).toEqual({
      fullName: 'Required',
      nationalId: 'Invalid format',
    })
  })
})
