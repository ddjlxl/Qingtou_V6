import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import BaseButton from '@/shared/components/BaseButton.vue'

function createWrapper(props = {}, slots = {}) {
  return mount(BaseButton, {
    props,
    slots,
    global: {
      plugins: [ElementPlus],
    },
  })
}

describe('AC-003: BaseButton', () => {
  it('renders button with default slot content', () => {
    const wrapper = createWrapper({}, { default: '提交' })
    expect(wrapper.text()).toBe('提交')
  })

  it('applies type prop as button type', () => {
    const wrapper = createWrapper({ type: 'primary' })
    expect(wrapper.classes()).toContain('el-button--primary')
  })

  it('applies size prop', () => {
    const wrapper = createWrapper({ size: 'small' })
    expect(wrapper.classes()).toContain('el-button--small')
  })

  it('shows loading state', () => {
    const wrapper = createWrapper({ loading: true })
    expect(wrapper.classes()).toContain('is-loading')
  })

  it('disables button when disabled prop is true', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.classes()).toContain('is-disabled')
  })

  it('emits click event', async () => {
    const wrapper = createWrapper()
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
