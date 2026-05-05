import { describe, it, expect, beforeEach } from 'vitest'
import { hasRole, isAdmin } from '@/shared/utils/permission'

describe('AC-002: hasRole', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns true when user has the role', () => {
    localStorage.setItem('user', JSON.stringify({ roles: ['admin', 'editor'] }))
    expect(hasRole('admin')).toBe(true)
  })

  it('returns false when user does not have the role', () => {
    localStorage.setItem('user', JSON.stringify({ roles: ['editor'] }))
    expect(hasRole('admin')).toBe(false)
  })

  it('returns false when no user in localStorage', () => {
    expect(hasRole('admin')).toBe(false)
  })

  it('returns false when user has no roles', () => {
    localStorage.setItem('user', JSON.stringify({}))
    expect(hasRole('admin')).toBe(false)
  })

  it('returns false when user data has invalid roles type', () => {
    localStorage.setItem('user', JSON.stringify({ roles: 'not-an-array' }))
    expect(hasRole('admin')).toBe(false)
  })

  it('returns false when user data is not an object', () => {
    localStorage.setItem('user', '"just-a-string"')
    expect(hasRole('admin')).toBe(false)
  })
})

describe('AC-002: isAdmin', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns true for admin user', () => {
    localStorage.setItem('user', JSON.stringify({ roles: ['admin'] }))
    expect(isAdmin()).toBe(true)
  })

  it('returns false for non-admin user', () => {
    localStorage.setItem('user', JSON.stringify({ roles: ['editor'] }))
    expect(isAdmin()).toBe(false)
  })

  it('returns false when no user', () => {
    expect(isAdmin()).toBe(false)
  })
})
