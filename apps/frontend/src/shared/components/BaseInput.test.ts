import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import BaseInput from '@/shared/components/BaseInput.vue'

function createWrapper(props = {}) {
  return mount(BaseInput, {
    props,
    global: {
      plugins: [ElementPlus],
    },
  })
}

describe('AC-003: BaseInput', () => {
  it('renders input element', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('binds modelValue via v-model', () => {
    const wrapper = createWrapper({ modelValue: 'hello' })
    expect(wrapper.find('input').element.value).toBe('hello')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = createWrapper()
    const input = wrapper.find('input')
    await input.setValue('new value')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['new value'])
  })

  it('renders placeholder', () => {
    const wrapper = createWrapper({ placeholder: '请输入' })
    expect(wrapper.find('input').attributes('placeholder')).toBe('请输入')
  })

  it('accepts clearable prop', () => {
    const wrapper = createWrapper({ clearable: true, modelValue: 'text' })
    expect(wrapper.props('clearable')).toBe(true)
  })

  it('disables input when disabled', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.find('.is-disabled').exists()).toBe(true)
  })
})
