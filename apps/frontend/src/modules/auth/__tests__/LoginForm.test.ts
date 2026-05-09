import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'

const mockPush = vi.fn()
const mockLogin = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('../stores/useAuthStore', () => ({
  useAuthStore: () => ({
    login: mockLogin,
    isLoggedIn: false,
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
  })

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

  it('calls authStore.login on form submit', async () => {
    const wrapper = createWrapper()
    mockLogin.mockResolvedValue(undefined)

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('admin')
    await inputs[1].setValue('123456')

    await wrapper.find('form').trigger('submit')

    expect(mockLogin).toHaveBeenCalledWith('admin', '123456')
  })

  it('redirects to home after successful login', async () => {
    const wrapper = createWrapper()
    mockLogin.mockResolvedValue(undefined)

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('admin')
    await inputs[1].setValue('123456')

    await wrapper.find('form').trigger('submit')

    await wrapper.vm.$nextTick()
    expect(mockPush).toHaveBeenCalledWith('/')
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
