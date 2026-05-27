import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { setActivePinia, createPinia } from 'pinia'
import SlotEditDialog from '../components/SlotEditDialog.vue'
import type { Slot } from '../types'

interface SlotEditDialogVM {
  formRef: { validate: () => Promise<boolean> }
  handleSubmit: () => Promise<void>
}

const mockUpdateSlot = vi.fn()

vi.mock('../stores/useWarehouseStore', () => ({
  useWarehouseStore: () => ({
    updateSlot: mockUpdateSlot,
  }),
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }
})

function makeSlot(overrides: Record<string, unknown> = {}): Slot {
  return {
    id: 'slot-1',
    zoneCode: 'A',
    slotNo: 'A-01-01',
    row: 1,
    col: 1,
    status: 'loaded',
    containerNo: 'CONT123',
    containerStatus: 'heavy',
    customerName: '测试客户',
    containerType: '40GP',
    sealNo: 'SEAL123',
    storedAt: '2026-01-01T00:00:00Z',
    remark: '测试备注',
    ...overrides,
  }
}

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(SlotEditDialog, {
    props: {
      visible: false,
      slotData: null,
      ...props,
    },
    global: {
      plugins: [ElementPlus],
    },
  })
}

describe('SlotEditDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('弹窗显示', () => {
    it('visible=true 时显示弹窗', () => {
      const wrapper = createWrapper({ visible: true, slotData: makeSlot() })
      const dialog = wrapper.findComponent({ name: 'ElDialog' })
      expect(dialog.props('modelValue')).toBe(true)
    })

    it('visible=false 时隐藏弹窗', () => {
      const wrapper = createWrapper({ visible: false, slotData: null })
      const dialog = wrapper.findComponent({ name: 'ElDialog' })
      expect(dialog.props('modelValue')).toBe(false)
    })

    it('显示标题"编辑库位"', () => {
      const wrapper = createWrapper({ visible: true, slotData: makeSlot() })
      const dialog = wrapper.findComponent({ name: 'ElDialog' })
      expect(dialog.props('title')).toBe('编辑库位')
    })
  })

  describe('关闭弹窗', () => {
    it('Dialog close 事件触发 update:visible', async () => {
      const wrapper = createWrapper({ visible: true, slotData: makeSlot() })

      const dialog = wrapper.findComponent({ name: 'ElDialog' })
      await dialog.vm.$emit('close')

      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')![0][0]).toBe(false)
    })
  })

  describe('提交功能', () => {
    it('handleSubmit 成功后关闭弹窗', async () => {
      mockUpdateSlot.mockResolvedValue(undefined)
      const wrapper = createWrapper({ visible: true, slotData: makeSlot() })
      await flushPromises()

      // mock ElForm.validate: 第三方库内部实现，test-utils 无法可靠触发
      const vm = wrapper.vm as unknown as SlotEditDialogVM
      vm.formRef = { validate: vi.fn().mockResolvedValue(true) }
      await vm.handleSubmit()

      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')![0][0]).toBe(false)
    })

    it('handleSubmit 成功后显示成功消息', async () => {
      const { ElMessage } = await import('element-plus')
      mockUpdateSlot.mockResolvedValue(undefined)
      const wrapper = createWrapper({ visible: true, slotData: makeSlot() })
      await flushPromises()

      // mock ElForm.validate: 第三方库内部实现，test-utils 无法可靠触发
      const vm = wrapper.vm as unknown as SlotEditDialogVM
      vm.formRef = { validate: vi.fn().mockResolvedValue(true) }
      await vm.handleSubmit()

      expect(ElMessage.success).toHaveBeenCalledWith('更新成功')
    })

    it('handleSubmit 失败后显示错误消息', async () => {
      const { ElMessage } = await import('element-plus')
      mockUpdateSlot.mockRejectedValue(new Error('网络错误'))
      const wrapper = createWrapper({ visible: true, slotData: makeSlot() })
      await flushPromises()

      // mock ElForm.validate: 第三方库内部实现，test-utils 无法可靠触发
      const vm = wrapper.vm as unknown as SlotEditDialogVM
      vm.formRef = { validate: vi.fn().mockResolvedValue(true) }
      await vm.handleSubmit()

      expect(ElMessage.error).toHaveBeenCalledWith('网络错误')
    })

    it('handleSubmit 失败后不关闭弹窗', async () => {
      mockUpdateSlot.mockRejectedValue(new Error('更新失败'))
      const wrapper = createWrapper({ visible: true, slotData: makeSlot() })
      await flushPromises()

      // mock ElForm.validate: 第三方库内部实现，test-utils 无法可靠触发
      const vm = wrapper.vm as unknown as SlotEditDialogVM
      vm.formRef = { validate: vi.fn().mockResolvedValue(true) }
      await vm.handleSubmit()

      expect(wrapper.emitted('update:visible')).toBeFalsy()
    })

    it('handleSubmit 不传 slotData 时不调用 API', async () => {
      const wrapper = createWrapper({ visible: true, slotData: null })
      await flushPromises()

      const vm = wrapper.vm as unknown as SlotEditDialogVM
      await vm.handleSubmit()

      expect(mockUpdateSlot).not.toHaveBeenCalled()
    })

    it('handleSubmit 调用 store.updateSlot', async () => {
      mockUpdateSlot.mockResolvedValue(undefined)
      const slot = makeSlot({ id: 'slot-1' })
      const wrapper = createWrapper({ visible: true, slotData: slot })
      await flushPromises()

      // mock ElForm.validate: 第三方库内部实现，test-utils 无法可靠触发
      const vm = wrapper.vm as unknown as SlotEditDialogVM
      vm.formRef = { validate: vi.fn().mockResolvedValue(true) }
      await vm.handleSubmit()

      expect(mockUpdateSlot).toHaveBeenCalledWith('slot-1', {
        customerName: undefined,
        remark: undefined,
      })
    })

    it('验证失败时不调用 updateSlot', async () => {
      const wrapper = createWrapper({ visible: true, slotData: makeSlot() })
      await flushPromises()

      // mock ElForm.validate: 验证失败场景
      const vm = wrapper.vm as unknown as SlotEditDialogVM
      vm.formRef = { validate: vi.fn().mockResolvedValue(false) }
      await vm.handleSubmit()

      expect(mockUpdateSlot).not.toHaveBeenCalled()
    })
  })
})
