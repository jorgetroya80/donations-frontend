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
})
