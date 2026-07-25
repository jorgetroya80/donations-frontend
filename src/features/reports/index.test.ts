import { describe, expect, it } from 'vitest'
import { useDonationReport, useExpenseReport } from './index'

describe('reports public API', () => {
  it('exposes the donation and expense summary hooks', () => {
    expect(useDonationReport).toBeTypeOf('function')
    expect(useExpenseReport).toBeTypeOf('function')
  })
})
