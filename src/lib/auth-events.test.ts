import { describe, expect, it } from 'vitest'
import { FORCE_ROTATION_EVENT } from './auth-events'

describe('auth-events', () => {
  it('exposes the force-rotation event name', () => {
    expect(FORCE_ROTATION_EVENT).toBe('auth:force-rotation')
  })
})
