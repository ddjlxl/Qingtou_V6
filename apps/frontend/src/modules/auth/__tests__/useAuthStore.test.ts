import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockLogin = vi.fn()

vi.mock('../services/authService', () => ({
  authService: {
    login: (...args: unknown[]) => mockLogin(...args),
  },
}))

import { useAuthStore } from '../stores/useAuthStore'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has empty token by default', () => {
      const store = useAuthStore()
      expect(store.token).toBe('')
    })

    it('has null user by default', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
    })

    it('isLoggedIn is false by default', () => {
      const store = useAuthStore()
      expect(store.isLoggedIn).toBe(false)
    })

    it('userRole is empty string by default', () => {
      const store = useAuthStore()
      expect(store.userRole).toBe('')
    })
  })

  describe('login', () => {
    it('calls authService.login with credentials', async () => {
      const store = useAuthStore()
      mockLogin.mockResolvedValue({
        token: 'test-token',
        user: { id: '1', username: 'admin', name: '管理员', role: 'admin' },
      })

      await store.login('admin', '123456')

      expect(mockLogin).toHaveBeenCalledWith('admin', '123456')
    })

    it('stores token after successful login', async () => {
      const store = useAuthStore()
      mockLogin.mockResolvedValue({
        token: 'test-token',
        user: { id: '1', username: 'admin', name: '管理员', role: 'admin' },
      })

      await store.login('admin', '123456')

      expect(store.token).toBe('test-token')
    })

    it('stores user after successful login', async () => {
      const store = useAuthStore()
      const user = { id: '1', username: 'admin', name: '管理员', role: 'admin' }
      mockLogin.mockResolvedValue({ token: 'test-token', user })

      await store.login('admin', '123456')

      expect(store.user).toEqual(user)
    })

    it('isLoggedIn becomes true after login', async () => {
      const store = useAuthStore()
      mockLogin.mockResolvedValue({
        token: 'test-token',
        user: { id: '1', username: 'admin', name: '管理员', role: 'admin' },
      })

      await store.login('admin', '123456')

      expect(store.isLoggedIn).toBe(true)
    })

    it('userRole returns role after login', async () => {
      const store = useAuthStore()
      mockLogin.mockResolvedValue({
        token: 'test-token',
        user: { id: '1', username: 'admin', name: '管理员', role: 'admin' },
      })

      await store.login('admin', '123456')

      expect(store.userRole).toBe('admin')
    })

    it('persists token to localStorage', async () => {
      const store = useAuthStore()
      mockLogin.mockResolvedValue({
        token: 'test-token',
        user: { id: '1', username: 'admin', name: '管理员', role: 'admin' },
      })

      await store.login('admin', '123456')

      expect(localStorage.getItem('token')).toBe('test-token')
    })
  })

  describe('logout', () => {
    it('clears token', async () => {
      const store = useAuthStore()
      mockLogin.mockResolvedValue({
        token: 'test-token',
        user: { id: '1', username: 'admin', name: '管理员', role: 'admin' },
      })
      await store.login('admin', '123456')

      store.logout()

      expect(store.token).toBe('')
    })

    it('clears user', async () => {
      const store = useAuthStore()
      mockLogin.mockResolvedValue({
        token: 'test-token',
        user: { id: '1', username: 'admin', name: '管理员', role: 'admin' },
      })
      await store.login('admin', '123456')

      store.logout()

      expect(store.user).toBeNull()
    })

    it('isLoggedIn becomes false after logout', async () => {
      const store = useAuthStore()
      mockLogin.mockResolvedValue({
        token: 'test-token',
        user: { id: '1', username: 'admin', name: '管理员', role: 'admin' },
      })
      await store.login('admin', '123456')

      store.logout()

      expect(store.isLoggedIn).toBe(false)
    })

    it('removes token from localStorage', async () => {
      const store = useAuthStore()
      mockLogin.mockResolvedValue({
        token: 'test-token',
        user: { id: '1', username: 'admin', name: '管理员', role: 'admin' },
      })
      await store.login('admin', '123456')

      store.logout()

      expect(localStorage.getItem('token')).toBeNull()
    })
  })

  describe('token restoration', () => {
    it('restores token from localStorage on init', () => {
      localStorage.setItem('token', 'saved-token')

      const store = useAuthStore()

      expect(store.token).toBe('saved-token')
    })

    it('isLoggedIn is true when token exists in localStorage', () => {
      localStorage.setItem('token', 'saved-token')

      const store = useAuthStore()

      expect(store.isLoggedIn).toBe(true)
    })
  })

  describe('user persistence', () => {
    it('persists user to localStorage after login', async () => {
      const store = useAuthStore()
      const user = { id: '1', username: 'admin', name: '管理员', role: 'admin' }
      mockLogin.mockResolvedValue({ token: 'test-token', user })

      await store.login('admin', '123456')

      const stored = JSON.parse(localStorage.getItem('user') || 'null')
      expect(stored).toEqual(user)
    })

    it('restores user from localStorage on init', () => {
      const user = { id: '1', username: 'admin', name: '管理员', role: 'admin' }
      localStorage.setItem('token', 'saved-token')
      localStorage.setItem('user', JSON.stringify(user))

      const store = useAuthStore()

      expect(store.user).toEqual(user)
      expect(store.userRole).toBe('admin')
    })

    it('removes user from localStorage on logout', async () => {
      const store = useAuthStore()
      const user = { id: '1', username: 'admin', name: '管理员', role: 'admin' }
      mockLogin.mockResolvedValue({ token: 'test-token', user })
      await store.login('admin', '123456')

      store.logout()

      expect(localStorage.getItem('user')).toBeNull()
    })

    it('handles corrupted user data in localStorage', () => {
      localStorage.setItem('token', 'saved-token')
      localStorage.setItem('user', 'not-valid-json')

      const store = useAuthStore()

      expect(store.user).toBeNull()
    })
  })
})
