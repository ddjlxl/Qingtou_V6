import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import {
  getToken,
  injectToken,
  handleResponseSuccess,
  handleResponseError,
  type ApiError,
} from '@/shared/api/client'

describe('http client', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('window', { location: { href: '' } })
  })

  describe('AC-001: getToken', () => {
    it('returns token from localStorage', () => {
      localStorage.setItem('token', 'my-token')
      expect(getToken()).toBe('my-token')
    })

    it('returns null when no token', () => {
      expect(getToken()).toBeNull()
    })
  })

  describe('AC-001: injectToken', () => {
    it('injects Authorization header when token exists', () => {
      localStorage.setItem('token', 'test-token-123')
      const config = { headers: {} } as unknown as InternalAxiosRequestConfig
      const result = injectToken(config)

      expect(result.headers.Authorization).toBe('Bearer test-token-123')
    })

    it('does not inject Authorization header when token is missing', () => {
      const config = { headers: {} } as unknown as InternalAxiosRequestConfig
      const result = injectToken(config)

      expect(result.headers.Authorization).toBeUndefined()
    })
  })

  describe('AC-001: handleResponseSuccess', () => {
    it('returns response data', () => {
      const response = { data: { code: 200, message: 'ok', data: { id: 1 } } } as unknown as AxiosResponse
      const result = handleResponseSuccess(response)

      expect(result).toEqual({ id: 1 })
    })
  })

  describe('AC-001: handleResponseError', () => {
    it('clears token and redirects on 401', async () => {
      localStorage.setItem('token', 'old-token')
      const error = { response: { status: 401, data: {} } } as unknown as AxiosError

      try {
        await handleResponseError(error)
      } catch (err) {
        const apiErr = err as ApiError
        expect(apiErr.code).toBe(401)
      }

      expect(localStorage.getItem('token')).toBeNull()
      expect(window.location.href).toBe('/login')
    })

    it('returns unified error format for non-401 errors', async () => {
      localStorage.setItem('token', 'keep-token')
      const error = {
        response: { status: 500, data: { message: 'Server error' } },
      } as unknown as AxiosError

      try {
        await handleResponseError(error)
      } catch (err) {
        const apiErr = err as ApiError
        expect(apiErr.code).toBe(500)
        expect(apiErr.message).toBe('Server error')
      }

      expect(localStorage.getItem('token')).toBe('keep-token')
      expect(window.location.href).toBe('')
    })

    it('returns unified error format for network errors', async () => {
      const error = { response: undefined, message: 'Network Error' } as unknown as AxiosError

      try {
        await handleResponseError(error)
      } catch (err) {
        const apiErr = err as ApiError
        expect(apiErr.code).toBe(0)
        expect(apiErr.message).toBe('Network Error')
      }
    })
  })
})
