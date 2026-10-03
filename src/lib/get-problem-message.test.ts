import { describe, expect, it } from 'vitest'
import { getProblemMessage } from './get-problem-message'

describe('getProblemMessage', () => {
  it('returns detail when present', () => {
    expect(
      getProblemMessage(
        { title: 'Conflicto', detail: 'El DNI ya está registrado' },
        'Error genérico'
      )
    ).toBe('El DNI ya está registrado')
  })

  it('falls back to title when detail is missing', () => {
    expect(getProblemMessage({ title: 'Conflicto' }, 'Error genérico')).toBe(
      'Conflicto'
    )
  })

  it('falls back to the generic message for non-ProblemDetail errors', () => {
    expect(getProblemMessage(new TypeError('boom'), 'Error genérico')).toBe(
      'Error genérico'
    )
    expect(getProblemMessage(undefined, 'Error genérico')).toBe(
      'Error genérico'
    )
    expect(getProblemMessage('oops', 'Error genérico')).toBe('Error genérico')
  })

  describe('request id reference', () => {
    const requestId = '3f2b6c1e-8a4d-4f7e-9c0b-5d1a2e3f4a5b'
    const withRef = (message: string) => `${message} (Ref.: ${requestId})`

    it.each([400, 500, 503])('appends the request id on %i', (status) => {
      expect(
        getProblemMessage(
          { status, detail: 'Validation failed', requestId },
          'Error genérico'
        )
      ).toBe(withRef('Validation failed'))
    })

    // 401 covers the login lockout, which the API reports as a 401.
    it.each([401, 404, 409])('omits the request id on %i', (status) => {
      expect(
        getProblemMessage(
          { status, detail: 'Account temporarily locked', requestId },
          'Error genérico'
        )
      ).toBe('Account temporarily locked')
    })

    // Field errors are shown under each input, so the user can fix them
    // without support.
    it('omits the request id on a 400 with field errors', () => {
      expect(
        getProblemMessage(
          {
            status: 400,
            detail: 'Validation failed',
            fields: { donationDate: 'Donation date cannot be in the future' },
            requestId,
          },
          'Error genérico'
        )
      ).toBe('Validation failed')
    })

    it('appends the request id to the fallback when detail and title are missing', () => {
      expect(
        getProblemMessage({ status: 500, requestId }, 'Error genérico')
      ).toBe(withRef('Error genérico'))
    })

    it('leaves the message unchanged when there is no request id', () => {
      expect(
        getProblemMessage(
          { status: 500, detail: 'Internal server error' },
          'Error genérico'
        )
      ).toBe('Internal server error')
    })
  })
})
