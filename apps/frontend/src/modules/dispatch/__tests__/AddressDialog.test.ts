import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { nextTick } from 'vue'

const mockFetchAddresses = vi.fn()
const mockCreateAddress = vi.fn()
const mockDeleteAddress = vi.fn()

vi.mock('../stores/useDispatchStore', () => ({
  useDispatchStore: () => ({
    addresses: [
      { id: 'a1', name: '上海港', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'a2', name: '宁波港', createdAt: '2026-01-02T00:00:00Z' },
    ],
    fetchAddresses: mockFetchAddresses,
    createAddress: mockCreateAddress,
    deleteAddress: mockDeleteAddress,
  }),
}))

import AddressDialog from '../components/AddressDialog.vue'

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(AddressDialog, {
    props: {
      visible: false,
      ...props,
    },
    global: {
      plugins: [ElementPlus],
    },
    attachTo: document.body,
  })
}

describe('AddressDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders dialog when visible', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()
    expect(wrapper.find('.address-dialog__add').exists()).toBe(true)
  })

  it('does not render dialog when not visible', () => {
    const wrapper = createWrapper({ visible: false })
    expect(wrapper.find('.address-dialog__add').exists()).toBe(false)
  })

  it('fetches addresses when dialog opens', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()
    expect(mockFetchAddresses).toHaveBeenCalled()
  })

  it('renders address list', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()
    const text = document.body.textContent || ''
    expect(text).toContain('上海港')
    expect(text).toContain('宁波港')
  })

  it('emits select with origin target', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    wrapper.vm.handleSelect('上海港', 'origin')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual(['上海港', 'origin'])
    expect(wrapper.emitted('update:visible')![0]).toEqual([false])
  })

  it('emits select with dest target', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    wrapper.vm.handleSelect('上海港', 'dest')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual(['上海港', 'dest'])
  })

  it('calls deleteAddress on delete', async () => {
    mockDeleteAddress.mockResolvedValue(undefined)
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    await wrapper.vm.handleDelete('a1')

    expect(mockDeleteAddress).toHaveBeenCalledWith('a1')
  })

  it('calls createAddress on save', async () => {
    mockCreateAddress.mockResolvedValue({ id: 'a3', name: '新地址', createdAt: '2026-01-03T00:00:00Z' })
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    wrapper.vm.newAddressName = '新地址'
    await wrapper.vm.handleAdd()

    expect(mockCreateAddress).toHaveBeenCalledWith('新地址')
  })

  it('does not call createAddress with empty name', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    wrapper.vm.newAddressName = '   '
    await wrapper.vm.handleAdd()

    expect(mockCreateAddress).not.toHaveBeenCalled()
  })
})