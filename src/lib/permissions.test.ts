import { describe, expect, it } from 'vitest'
import { canManageUsers, canRecordData, canViewReports } from './permissions'

const admin = { username: 'admin', roles: ['ADMIN'] }
const treasurer = { username: 'teso', roles: ['TREASURER'] }
const pastor = { username: 'pastor', roles: ['PASTOR'] }
const operator = { username: 'op', roles: ['OPERATOR'] }
const multiRole = { username: 'multi', roles: ['ADMIN', 'TREASURER'] }
const noRoles = { username: 'nobody', roles: [] }

describe('canViewReports', () => {
  it('returns true for TREASURER', () => {
    expect(canViewReports(treasurer)).toBe(true)
  })

  it('returns true for PASTOR', () => {
    expect(canViewReports(pastor)).toBe(true)
  })

  it('returns false for ADMIN-only', () => {
    expect(canViewReports(admin)).toBe(false)
  })

  it('returns false for OPERATOR', () => {
    expect(canViewReports(operator)).toBe(false)
  })

  it('returns true for multi-role with TREASURER', () => {
    expect(canViewReports(multiRole)).toBe(true)
  })

  it('returns false for null user', () => {
    expect(canViewReports(null)).toBe(false)
  })

  it('returns false for user with no roles', () => {
    expect(canViewReports(noRoles)).toBe(false)
  })
})

describe('canManageUsers', () => {
  it('returns true for ADMIN', () => {
    expect(canManageUsers(admin)).toBe(true)
  })

  it('returns false for TREASURER', () => {
    expect(canManageUsers(treasurer)).toBe(false)
  })

  it('returns false for PASTOR', () => {
    expect(canManageUsers(pastor)).toBe(false)
  })

  it('returns false for OPERATOR', () => {
    expect(canManageUsers(operator)).toBe(false)
  })

  it('returns true for multi-role with ADMIN', () => {
    expect(canManageUsers(multiRole)).toBe(true)
  })

  it('returns false for null user', () => {
    expect(canManageUsers(null)).toBe(false)
  })
})

describe('canRecordData', () => {
  it('returns true for OPERATOR', () => {
    expect(canRecordData(operator)).toBe(true)
  })

  it('returns true for TREASURER', () => {
    expect(canRecordData(treasurer)).toBe(true)
  })

  it('returns true for ADMIN', () => {
    expect(canRecordData(admin)).toBe(true)
  })

  it('returns false for PASTOR', () => {
    expect(canRecordData(pastor)).toBe(false)
  })

  it('returns true for multi-role with ADMIN+TREASURER', () => {
    expect(canRecordData(multiRole)).toBe(true)
  })

  it('returns false for null user', () => {
    expect(canRecordData(null)).toBe(false)
  })

  it('returns false for user with no roles', () => {
    expect(canRecordData(noRoles)).toBe(false)
  })
})
