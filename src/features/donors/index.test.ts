import { describe, expect, it } from 'vitest'
import { DonorPicker } from './index'

describe('donors public API', () => {
  it('exposes DonorPicker', () => {
    expect(DonorPicker).toBeTypeOf('function')
  })
})
