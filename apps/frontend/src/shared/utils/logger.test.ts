import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logger } from '@/shared/utils/logger'

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('debug', () => {
    it('calls console.debug with formatted message', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})

      logger.debug('test message')

      expect(spy).toHaveBeenCalledTimes(1)
      const callArg = spy.mock.calls[0][0] as string
      expect(callArg).toContain('[DEBUG]')
      expect(callArg).toContain('test message')
    })

    it('includes data when provided', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})

      logger.debug('test message', { key: 'value' })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][1]).toEqual({ key: 'value' })
    })
  })

  describe('info', () => {
    it('calls console.info with formatted message', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {})

      logger.info('info message')

      expect(spy).toHaveBeenCalledTimes(1)
      const callArg = spy.mock.calls[0][0] as string
      expect(callArg).toContain('[INFO]')
      expect(callArg).toContain('info message')
    })
  })

  describe('warn', () => {
    it('calls console.warn with formatted message', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      logger.warn('warning message')

      expect(spy).toHaveBeenCalledTimes(1)
      const callArg = spy.mock.calls[0][0] as string
      expect(callArg).toContain('[WARN]')
      expect(callArg).toContain('warning message')
    })
  })

  describe('error', () => {
    it('calls console.error with formatted message', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

      logger.error('error message')

      expect(spy).toHaveBeenCalledTimes(1)
      const callArg = spy.mock.calls[0][0] as string
      expect(callArg).toContain('[ERROR]')
      expect(callArg).toContain('error message')
    })
  })

  describe('timestamp format', () => {
    it('includes ISO timestamp in message', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {})

      logger.info('timestamp test')

      const callArg = spy.mock.calls[0][0] as string
      expect(callArg).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
    })
  })
})
