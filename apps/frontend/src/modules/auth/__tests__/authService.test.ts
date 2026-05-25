import { describe, it, expect, vi, beforeEach } from 'vitest'
import http from '@/shared/api/client'
import { authService } from '../services/authService'
import type { LoginResult, UserInfo } from '../types'

vi.mock('@/shared/api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should return token and user on successful login', async () => {
      const mockResult: LoginResult = {
        token: 'test-token-123',
        user: {
          id: '1',
          username: 'admin',
          name: '管理员',
          role: 'admin',
        },
      }
      vi.mocked(http.post).mockResolvedValue(mockResult)

      const result = await authService.login('admin', '123456')

      expect(http.post).toHaveBeenCalledWith('/v1/auth/login', {
        username: 'admin',
        password: '123456',
      })
      expect(result).toEqual(mockResult)
    })

    it('should handle driver role login', async () => {
      const mockResult: LoginResult = {
        token: 'driver-token-456',
        user: {
          id: '2',
          username: 'driver1',
          name: '司机张三',
          role: 'driver',
        },
      }
      vi.mocked(http.post).mockResolvedValue(mockResult)

      const result = await authService.login('driver1', 'password')

      expect(result.user.role).toBe('driver')
    })

    it('should handle network error', async () => {
      const networkError = {
        code: 0,
        message: '网络异常，请检查网络连接',
      }
      vi.mocked(http.post).mockRejectedValue(networkError)

      await expect(authService.login('admin', '123456')).rejects.toEqual(networkError)
    })

    it('should handle 401 unauthorized error', async () => {
      const unauthorizedError = {
        code: 401,
        message: '用户名或密码错误',
      }
      vi.mocked(http.post).mockRejectedValue(unauthorizedError)

      await expect(authService.login('admin', 'wrong')).rejects.toEqual(unauthorizedError)
    })

    it('should handle 500 server error', async () => {
      const serverError = {
        code: 500,
        message: '服务器内部错误',
      }
      vi.mocked(http.post).mockRejectedValue(serverError)

      await expect(authService.login('admin', '123456')).rejects.toEqual(serverError)
    })

    it('should handle timeout error', async () => {
      const timeoutError = {
        code: 0,
        message: 'timeout of 15000ms exceeded',
      }
      vi.mocked(http.post).mockRejectedValue(timeoutError)

      await expect(authService.login('admin', '123456')).rejects.toEqual(timeoutError)
    })

    it('should call API with correct endpoint', async () => {
      const mockResult: LoginResult = {
        token: 'test-token',
        user: { id: '1', username: 'admin', name: '管理员', role: 'admin' },
      }
      vi.mocked(http.post).mockResolvedValue(mockResult)

      await authService.login('admin', '123456')

      expect(http.post).toHaveBeenCalledWith('/v1/auth/login', expect.any(Object))
    })

    it('should handle empty username', async () => {
      const mockResult: LoginResult = {
        token: 'test-token',
        user: { id: '1', username: '', name: '测试', role: 'admin' },
      }
      vi.mocked(http.post).mockResolvedValue(mockResult)

      const result = await authService.login('', '123456')

      expect(result.user.username).toBe('')
    })

    it('should handle empty password', async () => {
      const mockResult: LoginResult = {
        token: 'test-token',
        user: { id: '1', username: 'admin', name: '管理员', role: 'admin' },
      }
      vi.mocked(http.post).mockResolvedValue(mockResult)

      await authService.login('admin', '')

      expect(http.post).toHaveBeenCalledWith('/v1/auth/login', {
        username: 'admin',
        password: '',
      })
    })
  })

  describe('getMe', () => {
    it('should return current user info', async () => {
      const mockUser: UserInfo = {
        id: '1',
        username: 'admin',
        name: '管理员',
        role: 'admin',
      }
      vi.mocked(http.get).mockResolvedValue(mockUser)

      const result = await authService.getMe()

      expect(http.get).toHaveBeenCalledWith('/v1/auth/me')
      expect(result).toEqual(mockUser)
    })

    it('should handle 401 when token expired', async () => {
      const unauthorizedError = {
        code: 401,
        message: '登录已过期，请重新登录',
      }
      vi.mocked(http.get).mockRejectedValue(unauthorizedError)

      await expect(authService.getMe()).rejects.toEqual(unauthorizedError)
    })

    it('should handle network errors', async () => {
      const networkError = {
        code: 0,
        message: '网络异常，请检查网络连接',
      }
      vi.mocked(http.get).mockRejectedValue(networkError)

      await expect(authService.getMe()).rejects.toEqual(networkError)
    })

    it('should handle 500 server error', async () => {
      const serverError = {
        code: 500,
        message: '服务器内部错误',
      }
      vi.mocked(http.get).mockRejectedValue(serverError)

      await expect(authService.getMe()).rejects.toEqual(serverError)
    })

    it('should call API with correct endpoint', async () => {
      const mockUser: UserInfo = {
        id: '1',
        username: 'admin',
        name: '管理员',
        role: 'admin',
      }
      vi.mocked(http.get).mockResolvedValue(mockUser)

      await authService.getMe()

      expect(http.get).toHaveBeenCalledWith('/v1/auth/me')
    })

    it('should handle driver user info', async () => {
      const mockUser: UserInfo = {
        id: '2',
        username: 'driver1',
        name: '司机张三',
        role: 'driver',
      }
      vi.mocked(http.get).mockResolvedValue(mockUser)

      const result = await authService.getMe()

      expect(result.role).toBe('driver')
    })
  })
})
