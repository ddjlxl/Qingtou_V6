import { describe, it, expect } from 'vitest'
import http from '@/shared/api/client'
import { formatDate, formatMoney } from '@/shared/utils/format'
import { isPhone, isRequired } from '@/shared/utils/validate'
import { hasRole, isAdmin } from '@/shared/utils/permission'
import { logger } from '@/shared/utils/logger'
import EmptyState from '@/shared/components/EmptyState.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'

describe('AC-006: shared module exports', () => {
  it('exports http client', () => {
    expect(http).toBeDefined()
    expect(typeof http.get).toBe('function')
    expect(typeof http.post).toBe('function')
  })

  it('exports formatDate', () => {
    expect(formatDate).toBeDefined()
    expect(typeof formatDate).toBe('function')
  })

  it('exports formatMoney', () => {
    expect(formatMoney).toBeDefined()
    expect(typeof formatMoney).toBe('function')
  })

  it('exports isPhone', () => {
    expect(isPhone).toBeDefined()
    expect(typeof isPhone).toBe('function')
  })

  it('exports isRequired', () => {
    expect(isRequired).toBeDefined()
    expect(typeof isRequired).toBe('function')
  })

  it('exports hasRole', () => {
    expect(hasRole).toBeDefined()
    expect(typeof hasRole).toBe('function')
  })

  it('exports isAdmin', () => {
    expect(isAdmin).toBeDefined()
    expect(typeof isAdmin).toBe('function')
  })

  it('exports EmptyState component', () => {
    expect(EmptyState).toBeDefined()
  })

  it('exports LoadingSpinner component', () => {
    expect(LoadingSpinner).toBeDefined()
  })

  it('exports logger', () => {
    expect(logger).toBeDefined()
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
  })
})
