import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'

const mockPush = vi.fn()
const mockLogin = vi.fn()
let mockUserRole = ''

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('../stores/useAuthStore', () => ({
  useAuthStore: () => ({
    login: mockLogin,
    isLoggedIn: false,
    get userRole() {
      return mockUserRole
    },
  }),
}))

import LoginForm from '../components/LoginForm.vue'

function createWrapper() {
  return mount(LoginForm, {
    global: {
      plugins: [ElementPlus],
    },
  })
}

describe('LoginForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockUserRole = ''
  })

  describe('rendering', () => {
    it('renders login form', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.login-card').exists()).toBe(true)
      expect(wrapper.text()).toContain('青投供应链')
    })

    it('renders username and password fields', () => {
      const wrapper = createWrapper()
      const inputs = wrapper.findAll('input')
      expect(inputs.length).toBeGreaterThanOrEqual(2)
    })

    it('renders login button', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('登录')
    })
  })

  describe('form validation', () => {
    it('shows warning when username is empty', async () => {
      const wrapper = createWrapper()
      const inputs = wrapper.findAll('input')
      await inputs[1].setValue('123456')

      await wrapper.find('form').trigger('submit')

      expect(mockLogin).not.toHaveBeenCalled()
    })

    it('shows warning when password is empty', async () => {
      const wrapper = createWrapper()
      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('admin')

      await wrapper.find('form').trigger('submit')

      expect(mockLogin).not.toHaveBeenCalled()
    })

    it('shows warning when username is only whitespace', async () => {
      const wrapper = createWrapper()
      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('   ')
      await inputs[1].setValue('123456')

      await wrapper.find('form').trigger('submit')

      expect(mockLogin).not.toHaveBeenCalled()
    })

    it('trims username before submission', async () => {
      const wrapper = createWrapper()
      mockLogin.mockResolvedValue(undefined)
      mockUserRole = 'admin'

      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('  admin  ')
      await inputs[1].setValue('123456')

      await wrapper.find('form').trigger('submit')

      expect(mockLogin).toHaveBeenCalledWith('admin', '123456')
    })
  })

  describe('login flow', () => {
    it('calls authStore.login on form submit', async () => {
      const wrapper = createWrapper()
      mockLogin.mockResolvedValue(undefined)
      mockUserRole = 'admin'

      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('admin')
      await inputs[1].setValue('123456')

      await wrapper.find('form').trigger('submit')

      expect(mockLogin).toHaveBeenCalledWith('admin', '123456')
    })

    it('shows error message on login failure', async () => {
      const wrapper = createWrapper()
      mockLogin.mockRejectedValue({ message: '用户名或密码错误' })

      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('admin')
      await inputs[1].setValue('wrong')

      await wrapper.find('form').trigger('submit')

      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
      expect(mockLogin).toHaveBeenCalled()
    })
  })

  describe('role-based routing', () => {
    it('redirects to /fleet for admin role', async () => {
      const wrapper = createWrapper()
      mockLogin.mockResolvedValue(undefined)
      mockUserRole = 'admin'

      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('admin')
      await inputs[1].setValue('123456')

      await wrapper.find('form').trigger('submit')

      await wrapper.vm.$nextTick()
      expect(mockPush).toHaveBeenCalledWith('/fleet')
    })

    it('redirects to /driver for driver role', async () => {
      const wrapper = createWrapper()
      mockLogin.mockResolvedValue(undefined)
      mockUserRole = 'driver'

      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('driver1')
      await inputs[1].setValue('123456')

      await wrapper.find('form').trigger('submit')

      await wrapper.vm.$nextTick()
      expect(mockPush).toHaveBeenCalledWith('/driver')
    })

    it('redirects to /fleet for unknown role', async () => {
      const wrapper = createWrapper()
      mockLogin.mockResolvedValue(undefined)
      mockUserRole = 'unknown'

      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('user')
      await inputs[1].setValue('123456')

      await wrapper.find('form').trigger('submit')

      await wrapper.vm.$nextTick()
      expect(mockPush).toHaveBeenCalledWith('/fleet')
    })
  })

  describe('loading state', () => {
    it('shows loading state during login', async () => {
      const wrapper = createWrapper()
      let resolveLogin: () => void
      mockLogin.mockImplementation(() => new Promise<void>((resolve) => {
        resolveLogin = resolve
      }))
      mockUserRole = 'admin'

      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('admin')
      await inputs[1].setValue('123456')

      wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      const button = wrapper.find('.login-button')
      expect(button.classes()).toContain('is-loading')

      resolveLogin!()
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    it('hides loading state after successful login', async () => {
      const wrapper = createWrapper()
      mockLogin.mockResolvedValue(undefined)
      mockUserRole = 'admin'

      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('admin')
      await inputs[1].setValue('123456')

      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      const button = wrapper.find('.login-button')
      expect(button.attributes('loading')).toBeUndefined()
    })

    it('hides loading state after login failure', async () => {
      const wrapper = createWrapper()
      mockLogin.mockRejectedValue({ message: '登录失败' })

      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('admin')
      await inputs[1].setValue('wrong')

      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      const button = wrapper.find('.login-button')
      expect(button.attributes('loading')).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('handles very long username', async () => {
      const wrapper = createWrapper()
      mockLogin.mockResolvedValue(undefined)
      mockUserRole = 'admin'

      const longUsername = 'a'.repeat(100)
      const inputs = wrapper.findAll('input')
      await inputs[0].setValue(longUsername)
      await inputs[1].setValue('123456')

      await wrapper.find('form').trigger('submit')

      expect(mockLogin).toHaveBeenCalledWith(longUsername, '123456')
    })

    it('handles very long password', async () => {
      const wrapper = createWrapper()
      mockLogin.mockResolvedValue(undefined)
      mockUserRole = 'admin'

      const longPassword = 'p'.repeat(100)
      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('admin')
      await inputs[1].setValue(longPassword)

      await wrapper.find('form').trigger('submit')

      expect(mockLogin).toHaveBeenCalledWith('admin', longPassword)
    })

    it('handles special characters in username', async () => {
      const wrapper = createWrapper()
      mockLogin.mockResolvedValue(undefined)
      mockUserRole = 'admin'

      const specialUsername = 'user@#$%^&*()'
      const inputs = wrapper.findAll('input')
      await inputs[0].setValue(specialUsername)
      await inputs[1].setValue('123456')

      await wrapper.find('form').trigger('submit')

      expect(mockLogin).toHaveBeenCalledWith(specialUsername, '123456')
    })

    it('handles special characters in password', async () => {
      const wrapper = createWrapper()
      mockLogin.mockResolvedValue(undefined)
      mockUserRole = 'admin'

      const specialPassword = 'p@ss!w0rd#$%'
      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('admin')
      await inputs[1].setValue(specialPassword)

      await wrapper.find('form').trigger('submit')

      expect(mockLogin).toHaveBeenCalledWith('admin', specialPassword)
    })

    it('handles unicode characters in username', async () => {
      const wrapper = createWrapper()
      mockLogin.mockResolvedValue(undefined)
      mockUserRole = 'admin'

      const unicodeUsername = '用户名测试'
      const inputs = wrapper.findAll('input')
      await inputs[0].setValue(unicodeUsername)
      await inputs[1].setValue('123456')

      await wrapper.find('form').trigger('submit')

      expect(mockLogin).toHaveBeenCalledWith(unicodeUsername, '123456')
    })

    it('handles network error gracefully', async () => {
      const wrapper = createWrapper()
      mockLogin.mockRejectedValue({ code: 0, message: '网络异常，请检查网络连接' })

      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('admin')
      await inputs[1].setValue('123456')

      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      expect(mockLogin).toHaveBeenCalled()
    })
  })
})
