import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import EmptyState from '@/shared/components/EmptyState.vue'

function createWrapper(props = {}, slots = {}) {
  return mount(EmptyState, {
    props,
    slots,
    global: {
      plugins: [ElementPlus],
    },
  })
}

describe('AC-003: EmptyState', () => {
  it('renders default title', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('暂无数据')
  })

  it('renders custom title', () => {
    const wrapper = createWrapper({ title: '没有订单' })
    expect(wrapper.text()).toContain('没有订单')
  })

  it('renders description when provided', () => {
    const wrapper = createWrapper({ description: '请先创建订单' })
    expect(wrapper.text()).toContain('请先创建订单')
  })

  it('does not render description when not provided', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.empty-state__description').exists()).toBe(false)
  })

  it('renders slot content', () => {
    const wrapper = createWrapper({}, { default: '<button>刷新</button>' })
    expect(wrapper.html()).toContain('刷新')
  })

  it('has scoped styles', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.empty-state').exists()).toBe(true)
  })
})
