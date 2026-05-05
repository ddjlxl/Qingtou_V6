import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'

function createWrapper(props = {}) {
  return mount(LoadingSpinner, {
    props,
    global: {
      plugins: [ElementPlus],
    },
  })
}

describe('AC-003: LoadingSpinner', () => {
  it('renders default text', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('加载中...')
  })

  it('renders custom text', () => {
    const wrapper = createWrapper({ text: '数据加载中，请稍候' })
    expect(wrapper.text()).toContain('数据加载中，请稍候')
  })

  it('does not render text when empty', () => {
    const wrapper = createWrapper({ text: '' })
    expect(wrapper.find('.loading-spinner__text').exists()).toBe(false)
  })

  it('applies fullscreen class when fullscreen is true', () => {
    const wrapper = createWrapper({ fullscreen: true })
    expect(wrapper.find('.loading-spinner--fullscreen').exists()).toBe(true)
  })

  it('does not apply fullscreen class by default', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.loading-spinner--fullscreen').exists()).toBe(false)
  })

  it('has scoped styles', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
  })
})
