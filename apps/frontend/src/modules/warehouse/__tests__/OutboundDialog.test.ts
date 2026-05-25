import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { setActivePinia, createPinia } from 'pinia'
import OutboundDialog from '../components/OutboundDialog.vue'
import type { Slot } from '../types'

const mockOutbound = vi.fn()

vi.mock('../stores/useWarehouseStore', () => ({
  useWarehouseStore: () => ({
    outbound: mockOutbound,
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
  return mount(OutboundDialog, {
    props: {
      visible: false,
      selectedSlots: [],
      ...props,
    },
    global: {
      plugins: [ElementPlus],
    },
  })
}

describe('OutboundDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('弹窗显示', () => {
    it('visible=true 时显示弹窗', () => {
      const wrapper = createWrapper({ visible: true, selectedSlots: [makeSlot()] })
      const dialog = wrapper.findComponent({ name: 'ElDialog' })
      expect(dialog.props('modelValue')).toBe(true)
    })

    it('visible=false 时隐藏弹窗', () => {
      const wrapper = createWrapper({ visible: false, selectedSlots: [] })
      const dialog = wrapper.findComponent({ name: 'ElDialog' })
      expect(dialog.props('modelValue')).toBe(false)
    })

    it('显示标题"确认出库"', () => {
      const wrapper = createWrapper({ visible: true, selectedSlots: [makeSlot()] })
      const dialog = wrapper.findComponent({ name: 'ElDialog' })
      expect(dialog.props('title')).toBe('确认出库')
    })
  })

  describe('关闭弹窗', () => {
    it('Dialog close 事件触发 update:visible', async () => {
      const wrapper = createWrapper({ visible: true, selectedSlots: [makeSlot()] })

      const dialog = wrapper.findComponent({ name: 'ElDialog' })
      await dialog.vm.$emit('close')

      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')![0][0]).toBe(false)
    })
  })

  describe('提交功能', () => {
    it('handleSubmit 调用 store.outbound 传递 slot IDs', async () => {
      mockOutbound.mockResolvedValue(undefined)
      const slots = [makeSlot({ id: 'slot-1' }), makeSlot({ id: 'slot-2' })]
      const wrapper = createWrapper({ visible: true, selectedSlots: slots })
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleSubmit: () => Promise<void> }
      await vm.handleSubmit()

      expect(mockOutbound).toHaveBeenCalledWith(['slot-1', 'slot-2'], undefined)
    })

    it('handleSubmit 成功后关闭弹窗', async () => {
      mockOutbound.mockResolvedValue(undefined)
      const wrapper = createWrapper({ visible: true, selectedSlots: [makeSlot()] })
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleSubmit: () => Promise<void> }
      await vm.handleSubmit()

      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')![0][0]).toBe(false)
    })

    it('handleSubmit 成功后显示成功消息', async () => {
      const { ElMessage } = await import('element-plus')
      mockOutbound.mockResolvedValue(undefined)
      const wrapper = createWrapper({ visible: true, selectedSlots: [makeSlot()] })
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleSubmit: () => Promise<void> }
      await vm.handleSubmit()

      expect(ElMessage.success).toHaveBeenCalledWith('出库成功')
    })

    it('handleSubmit 失败后显示错误消息', async () => {
      const { ElMessage } = await import('element-plus')
      mockOutbound.mockRejectedValue(new Error('网络错误'))
      const wrapper = createWrapper({ visible: true, selectedSlots: [makeSlot()] })
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleSubmit: () => Promise<void> }
      await vm.handleSubmit()

      expect(ElMessage.error).toHaveBeenCalledWith('网络错误')
    })

    it('handleSubmit 失败后不关闭弹窗', async () => {
      mockOutbound.mockRejectedValue(new Error('出库失败'))
      const wrapper = createWrapper({ visible: true, selectedSlots: [makeSlot()] })
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleSubmit: () => Promise<void> }
      await vm.handleSubmit()

      expect(wrapper.emitted('update:visible')).toBeFalsy()
    })
  })

  describe('业务类型选项', () => {
    it('包含重箱运输选项', () => {
      const wrapper = createWrapper({ visible: true, selectedSlots: [makeSlot()] })
      const vm = wrapper.vm as unknown as { businessTypeOptions: Array<{ label: string; value: string }> }
      const option = vm.businessTypeOptions.find((o) => o.value === 'heavy_transport')
      expect(option?.label).toBe('重箱运输')
    })

    it('包含空箱运输选项', () => {
      const wrapper = createWrapper({ visible: true, selectedSlots: [makeSlot()] })
      const vm = wrapper.vm as unknown as { businessTypeOptions: Array<{ label: string; value: string }> }
      const option = vm.businessTypeOptions.find((o) => o.value === 'empty_transport')
      expect(option?.label).toBe('空箱运输')
    })

    it('包含短驳选项', () => {
      const wrapper = createWrapper({ visible: true, selectedSlots: [makeSlot()] })
      const vm = wrapper.vm as unknown as { businessTypeOptions: Array<{ label: string; value: string }> }
      const option = vm.businessTypeOptions.find((o) => o.value === 'short_haul')
      expect(option?.label).toBe('短驳')
    })
  })
})
