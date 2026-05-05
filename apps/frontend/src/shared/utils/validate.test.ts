import { describe, it, expect } from 'vitest'
import { isPhone, isRequired } from '@/shared/utils/validate'

describe('AC-002: isPhone', () => {
  it('validates correct phone number', () => {
    expect(isPhone('13800138000')).toBe(true)
  })

  it('rejects short number', () => {
    expect(isPhone('1380013800')).toBe(false)
  })

  it('rejects non-numeric', () => {
    expect(isPhone('abcdefghijk')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isPhone('')).toBe(false)
  })
})

describe('AC-002: isRequired', () => {
  it('validates non-empty string', () => {
    expect(isRequired('hello')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isRequired('')).toBe(false)
  })

  it('rejects whitespace-only string', () => {
    expect(isRequired('   ')).toBe(false)
  })

  it('rejects null', () => {
    expect(isRequired(null)).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isRequired(undefined)).toBe(false)
  })
})
