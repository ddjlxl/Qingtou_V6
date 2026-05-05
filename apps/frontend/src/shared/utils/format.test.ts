import { describe, it, expect } from 'vitest'
import { formatDate, formatMoney } from '@/shared/utils/format'

describe('AC-002: formatDate', () => {
  it('formats date string with yyyy-MM-dd pattern', () => {
    expect(formatDate('2026-05-04', 'yyyy-MM-dd')).toBe('2026-05-04')
  })

  it('formats ISO datetime with HH:mm pattern', () => {
    expect(formatDate('2026-05-04T10:30:00', 'HH:mm')).toBe('10:30')
  })

  it('formats with yyyy-MM-dd HH:mm pattern', () => {
    expect(formatDate('2026-05-04T10:30:00', 'yyyy-MM-dd HH:mm')).toBe('2026-05-04 10:30')
  })

  it('uses default pattern yyyy-MM-dd HH:mm:ss', () => {
    const result = formatDate('2026-05-04T10:30:00')
    expect(result).toBe('2026-05-04 10:30:00')
  })

  it('handles Date object', () => {
    const date = new Date(2026, 4, 4, 10, 30, 0)
    expect(formatDate(date, 'yyyy-MM-dd')).toBe('2026-05-04')
  })

  it('returns empty string for invalid date', () => {
    expect(formatDate('invalid-date', 'yyyy-MM-dd')).toBe('')
  })
})

describe('AC-002: formatMoney', () => {
  it('formats integer amount', () => {
    expect(formatMoney(1234)).toBe('1,234.00')
  })

  it('formats decimal amount', () => {
    expect(formatMoney(1234.5)).toBe('1,234.50')
  })

  it('formats with custom decimals', () => {
    expect(formatMoney(1234.5, 0)).toBe('1,235')
  })

  it('formats zero', () => {
    expect(formatMoney(0)).toBe('0.00')
  })

  it('formats large number', () => {
    expect(formatMoney(1234567.89)).toBe('1,234,567.89')
  })
})
