import { describe, expect, it } from 'vitest'
import { parseApiFieldErrors } from './parse-api-field-errors'

describe('parseApiFieldErrors', () => {
  it('returns fields from a validation error', () => {
    expect(parseApiFieldErrors({ fields: { nationalId: 'Invalid format' } })).toEqual({
      nationalId: 'Invalid format',
    })
  })

  it('returns empty object for unknown error', () => {
    expect(parseApiFieldErrors(new Error('oops'))).toEqual({})
  })

  it('returns empty object when data has no fields property', () => {
    expect(parseApiFieldErrors({ message: 'Internal server error' })).toEqual({})
  })

  it('returns empty object when error is undefined', () => {
    expect(parseApiFieldErrors(undefined)).toEqual({})
  })

  it('handles multiple field errors', () => {
    expect(
      parseApiFieldErrors({ fields: { fullName: 'Required', nationalId: 'Invalid format' } })
    ).toEqual({ fullName: 'Required', nationalId: 'Invalid format' })
  })
})
