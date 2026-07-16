import { describe, expect, it } from 'vitest'
import { parseApiFieldErrors } from './parse-api-field-errors'

describe('parseApiFieldErrors', () => {
  it('returns fields from a validation problem detail', () => {
    expect(
      parseApiFieldErrors({
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        detail: 'Validation failed',
        instance: '/api/v1/donors',
        fields: { nationalId: 'Invalid format' },
      })
    ).toEqual({
      nationalId: 'Invalid format',
    })
  })

  it('returns empty object for unknown error', () => {
    expect(parseApiFieldErrors(new Error('oops'))).toEqual({})
  })

  it('returns empty object when data has no fields property', () => {
    expect(
      parseApiFieldErrors({
        type: 'about:blank',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Internal server error',
        instance: '/api/v1/donors',
      })
    ).toEqual({})
  })

  it('returns empty object when error is undefined', () => {
    expect(parseApiFieldErrors(undefined)).toEqual({})
  })

  it('handles multiple field errors', () => {
    expect(
      parseApiFieldErrors({
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        detail: 'Validation failed',
        instance: '/api/v1/donors',
        fields: { fullName: 'Required', nationalId: 'Invalid format' },
      })
    ).toEqual({ fullName: 'Required', nationalId: 'Invalid format' })
  })
})
