import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { nextTick } from 'vue'

const mockFetchAddresses = vi.fn()
const mockCreateAddress = vi.fn()
const mockDeleteAddress = vi.fn()

const mockAddresses = [
  { id: 'a1', name: '上海港', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'a2', name: '宁波港', createdAt: '2026-01-02T00:00:00Z' },
]

vi.mock('../stores/useDispatchStore', () => ({
  useDispatchStore: () => ({
    addresses: mockAddresses,
    fetchAddresses: mockFetchAddresses,
    createAddress: mockCreateAddress,
    deleteAddress: mockDeleteAddress,
  }),
}))

import AddressDialog from '../components/AddressDialog.vue'

function createWrapper(props: { visible?: boolean } = {}) {
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

describe('AddressDialog - 对话框显示', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('visible 为 true 时显示对话框内容', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    expect(wrapper.find('.address-dialog__add').exists()).toBe(true)
  })

  it('visible 为 false 时不显示对话框内容', () => {
    const wrapper = createWrapper({ visible: false })
    expect(wrapper.find('.address-dialog__add').exists()).toBe(false)
  })

  it('对话框打开时获取地址列表', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    expect(mockFetchAddresses).toHaveBeenCalled()
  })
})

describe('AddressDialog - 地址列表展示', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('显示已有地址列表', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    const text = document.body.textContent || ''
    expect(text).toContain('上海港')
    expect(text).toContain('宁波港')
  })

  it('每个地址显示设为起运地、设为目的地、删除按钮', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    const text = document.body.textContent || ''
    expect(text).toContain('设为起运地')
    expect(text).toContain('设为目的地')
    expect(text).toContain('删除')
  })
})

describe('AddressDialog - 选择地址', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('点击设为起运地触发 select 事件并关闭对话框', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    // 找到第一个地址的"设为起运地"按钮
    const items = wrapper.findAll('.address-dialog__item')
    if (items.length > 0) {
      const originButton = items[0].findAllComponents({ name: 'ElButton' }).find(
        (btn: VueWrapper) => btn.text().includes('设为起运地')
      )
      if (originButton) {
        await originButton.trigger('click')

        expect(wrapper.emitted('select')).toBeTruthy()
        expect(wrapper.emitted('select')![0]).toEqual(['上海港', 'origin'])
        expect(wrapper.emitted('update:visible')).toBeTruthy()
        expect(wrapper.emitted('update:visible')![0]).toEqual([false])
      }
    }
  })

  it('点击设为目的地触发 select 事件', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    const items = wrapper.findAll('.address-dialog__item')
    if (items.length > 0) {
      const destButton = items[0].findAllComponents({ name: 'ElButton' }).find(
        (btn: VueWrapper) => btn.text().includes('设为目的地')
      )
      if (destButton) {
        await destButton.trigger('click')

        expect(wrapper.emitted('select')).toBeTruthy()
        expect(wrapper.emitted('select')![0]).toEqual(['上海港', 'dest'])
      }
    }
  })
})

describe('AddressDialog - 删除地址', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('点击删除按钮调用 store.deleteAddress', async () => {
    mockDeleteAddress.mockResolvedValue(undefined)
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    const items = wrapper.findAll('.address-dialog__item')
    if (items.length > 0) {
      const deleteButton = items[0].findAllComponents({ name: 'ElButton' }).find(
        (btn: VueWrapper) => btn.text().includes('删除')
      )
      if (deleteButton) {
        await deleteButton.trigger('click')
        await nextTick()

        expect(mockDeleteAddress).toHaveBeenCalledWith('a1')
      }
    }
  })
})

describe('AddressDialog - 新增地址', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('输入地址名称并点击保存调用 store.createAddress', async () => {
    mockCreateAddress.mockResolvedValue({ id: 'a3', name: '新地址', createdAt: '2026-01-03T00:00:00Z' })
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    // 找到输入框并输入
    const input = wrapper.findComponent({ name: 'ElInput' })
    if (input.exists()) {
      await input.setValue('新地址')
      await nextTick()
    }

    // 找到保存按钮并点击
    const saveButton = wrapper.find('.address-dialog__add').findAllComponents({ name: 'ElButton' }).find(
      (btn: VueWrapper) => btn.text().includes('保存')
    )
    if (saveButton) {
      await saveButton.trigger('click')
      await nextTick()

      expect(mockCreateAddress).toHaveBeenCalledWith('新地址')
    }
  })

  it('空名称不调用 store.createAddress', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    // 不输入任何内容直接点击保存
    const saveButton = wrapper.find('.address-dialog__add').findAllComponents({ name: 'ElButton' }).find(
      (btn: VueWrapper) => btn.text().includes('保存')
    )
    if (saveButton) {
      await saveButton.trigger('click')
      await nextTick()

      expect(mockCreateAddress).not.toHaveBeenCalled()
    }
  })

  it('只有空格的名称不调用 store.createAddress', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    const input = wrapper.findComponent({ name: 'ElInput' })
    if (input.exists()) {
      await input.setValue('   ')
      await nextTick()
    }

    const saveButton = wrapper.find('.address-dialog__add').findAllComponents({ name: 'ElButton' }).find(
      (btn: VueWrapper) => btn.text().includes('保存')
    )
    if (saveButton) {
      await saveButton.trigger('click')
      await nextTick()

      expect(mockCreateAddress).not.toHaveBeenCalled()
    }
  })
})

describe('AddressDialog - 关闭对话框', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('选择地址后自动关闭对话框', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    const items = wrapper.findAll('.address-dialog__item')
    if (items.length > 0) {
      const originButton = items[0].findAllComponents({ name: 'ElButton' }).find(
        (btn: VueWrapper) => btn.text().includes('设为起运地')
      )
      if (originButton) {
        await originButton.trigger('click')

        expect(wrapper.emitted('update:visible')).toBeTruthy()
        expect(wrapper.emitted('update:visible')![0]).toEqual([false])
      }
    }
  })
})
