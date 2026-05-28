import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { setActivePinia, createPinia } from 'pinia'
import ManualInboundDialog from '../components/ManualInboundDialog.vue'

const mockManualInbound = vi.fn()

vi.mock('../stores/useWarehouseStore', () => ({
  useWarehouseStore: () => ({
    manualInbound: mockManualInbound,
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

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(ManualInboundDialog, {
    props: {
      visible: false,
      zoneCode: 'A',
      ...props,
    },
    global: {
      plugins: [ElementPlus],
    },
  })
}

describe('ManualInboundDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('弹窗显示', () => {
    it('visible=true 时显示弹窗', () => {
      const wrapper = createWrapper({ visible: true })
      const dialog = wrapper.findComponent({ name: 'ElDialog' })
      expect(dialog.props('modelValue')).toBe(true)
    })

    it('visible=false 时隐藏弹窗', () => {
      const wrapper = createWrapper({ visible: false })
      const dialog = wrapper.findComponent({ name: 'ElDialog' })
      expect(dialog.props('modelValue')).toBe(false)
    })

    it('显示标题"手动入库"', () => {
      const wrapper = createWrapper({ visible: true })
      const dialog = wrapper.findComponent({ name: 'ElDialog' })
      expect(dialog.props('title')).toBe('手动入库')
    })
  })

  describe('关闭弹窗', () => {
    it('Dialog close 事件触发 update:visible', async () => {
      const wrapper = createWrapper({ visible: true })

      const dialog = wrapper.findComponent({ name: 'ElDialog' })
      await dialog.vm.$emit('close')

      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')![0][0]).toBe(false)
    })
  })

  describe('提交功能', () => {
    it('handleSubmit 调用 store.manualInbound', async () => {
      mockManualInbound.mockResolvedValue(undefined)
      const wrapper = createWrapper({ visible: true, zoneCode: 'B' })
      await flushPromises()

      const vm = wrapper.vm as unknown as {
        handleSubmit: () => Promise<void>
        form: {
          containerNo: string
          containerStatus: 'heavy' | 'empty'
          customerName: string
          containerType: string
          sealNo: string
        }
      }
      vm.form.containerNo = 'ABCD1234567'
      vm.form.containerStatus = 'heavy'
      vm.form.customerName = '客户A'
      vm.form.containerType = '40GP'
      vm.form.sealNo = 'SEAL123'
      await vm.handleSubmit()

      expect(mockManualInbound).toHaveBeenCalledWith('B', {
        containerNo: 'ABCD1234567',
        containerStatus: 'heavy',
        customerName: '客户A',
        containerType: '40GP',
        sealNo: 'SEAL123',
      })
    })

    it('handleSubmit 成功后关闭弹窗', async () => {
      mockManualInbound.mockResolvedValue(undefined)
      const wrapper = createWrapper({ visible: true })
      await flushPromises()

      const vm = wrapper.vm as unknown as {
        handleSubmit: () => Promise<void>
        form: {
          containerNo: string
          containerStatus: 'heavy' | 'empty'
        }
      }
      vm.form.containerNo = 'ABCD1234567'
      vm.form.containerStatus = 'heavy'
      await vm.handleSubmit()

      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')![0][0]).toBe(false)
    })

    it('handleSubmit 成功后显示成功消息', async () => {
      const { ElMessage } = await import('element-plus')
      mockManualInbound.mockResolvedValue(undefined)
      const wrapper = createWrapper({ visible: true })
      await flushPromises()

      const vm = wrapper.vm as unknown as {
        handleSubmit: () => Promise<void>
        form: {
          containerNo: string
          containerStatus: 'heavy' | 'empty'
        }
      }
      vm.form.containerNo = 'ABCD1234567'
      vm.form.containerStatus = 'heavy'
      await vm.handleSubmit()

      expect(ElMessage.success).toHaveBeenCalledWith('入库成功')
    })

    it('handleSubmit 失败后显示错误消息', async () => {
      const { ElMessage } = await import('element-plus')
      mockManualInbound.mockRejectedValue(new Error('网络错误'))
      const wrapper = createWrapper({ visible: true })
      await flushPromises()

      const vm = wrapper.vm as unknown as {
        handleSubmit: () => Promise<void>
        form: {
          containerNo: string
          containerStatus: 'heavy' | 'empty'
        }
      }
      vm.form.containerNo = 'ABCD1234567'
      vm.form.containerStatus = 'heavy'
      await vm.handleSubmit()

      expect(ElMessage.error).toHaveBeenCalledWith('网络错误')
    })

    it('handleSubmit 失败后不关闭弹窗', async () => {
      mockManualInbound.mockRejectedValue(new Error('入库失败'))
      const wrapper = createWrapper({ visible: true })
      await flushPromises()

      const vm = wrapper.vm as unknown as {
        handleSubmit: () => Promise<void>
        form: {
          containerNo: string
          containerStatus: 'heavy' | 'empty'
        }
      }
      vm.form.containerNo = 'ABCD1234567'
      vm.form.containerStatus = 'heavy'
      await vm.handleSubmit()

      expect(wrapper.emitted('update:visible')).toBeFalsy()
    })
  })

  describe('表单验证规则', () => {
    it('containerNo 必填', async () => {
      const wrapper = createWrapper({ visible: true })
      const vm = wrapper.vm as unknown as { rules: { containerNo: { required: boolean }[] } }
      expect(vm.rules.containerNo[0].required).toBe(true)
    })

    it('containerNo 格式验证', async () => {
      const wrapper = createWrapper({ visible: true })
      const vm = wrapper.vm as unknown as { rules: { containerNo: { pattern: RegExp }[] } }
      expect(vm.rules.containerNo[1].pattern).toEqual(/^[A-Z]{4}\d{7}$/)
    })
  })

  describe('箱型选项', () => {
    it('包含 20GP 选项', () => {
      const wrapper = createWrapper({ visible: true })
      const vm = wrapper.vm as unknown as { containerTypeOptions: Array<{ label: string; value: string }> }
      const option = vm.containerTypeOptions.find((o) => o.value === '20GP')
      expect(option?.label).toBe('20GP')
    })

    it('包含 40GP 选项', () => {
      const wrapper = createWrapper({ visible: true })
      const vm = wrapper.vm as unknown as { containerTypeOptions: Array<{ label: string; value: string }> }
      const option = vm.containerTypeOptions.find((o) => o.value === '40GP')
      expect(option?.label).toBe('40GP')
    })

    it('包含 40HQ 选项', () => {
      const wrapper = createWrapper({ visible: true })
      const vm = wrapper.vm as unknown as { containerTypeOptions: Array<{ label: string; value: string }> }
      const option = vm.containerTypeOptions.find((o) => o.value === '40HQ')
      expect(option?.label).toBe('40HQ')
    })

    it('包含 45HQ 选项', () => {
      const wrapper = createWrapper({ visible: true })
      const vm = wrapper.vm as unknown as { containerTypeOptions: Array<{ label: string; value: string }> }
      const option = vm.containerTypeOptions.find((o) => o.value === '45HQ')
      expect(option?.label).toBe('45HQ')
    })
  })

  describe('箱号自动转大写', () => {
    it('输入小写字母自动转为大写', async () => {
      const wrapper = createWrapper({ visible: true })
      const vm = wrapper.vm as unknown as {
        form: { containerNo: string }
      }
      vm.form.containerNo = 'abcd1234567'
      await flushPromises()
      expect(vm.form.containerNo).toBe('ABCD1234567')
    })

    it('输入混合大小写自动转为大写', async () => {
      const wrapper = createWrapper({ visible: true })
      const vm = wrapper.vm as unknown as {
        form: { containerNo: string }
      }
      vm.form.containerNo = 'AbCd1234567'
      await flushPromises()
      expect(vm.form.containerNo).toBe('ABCD1234567')
    })
  })

  describe('箱状态默认值', () => {
    it('默认为空箱', () => {
      const wrapper = createWrapper({ visible: true })
      const vm = wrapper.vm as unknown as {
        form: { containerStatus: string }
      }
      expect(vm.form.containerStatus).toBe('empty')
    })
  })

  describe('货主历史记录', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('入库成功后保存货主到历史记录', async () => {
      mockManualInbound.mockResolvedValue(undefined)
      const wrapper = createWrapper({ visible: true })
      await flushPromises()

      const vm = wrapper.vm as unknown as {
        handleSubmit: () => Promise<void>
        form: {
          containerNo: string
          containerStatus: 'heavy' | 'empty'
          customerName: string
        }
      }
      vm.form.containerNo = 'ABCD1234567'
      vm.form.containerStatus = 'empty'
      vm.form.customerName = '测试客户'
      await vm.handleSubmit()

      const history = JSON.parse(localStorage.getItem('customer_history') || '[]')
      expect(history).toContain('测试客户')
    })

    it('历史记录最多保存 20 条', async () => {
      const existingHistory = Array.from({ length: 25 }, (_, i) => `客户${i + 1}`)
      localStorage.setItem('customer_history', JSON.stringify(existingHistory))

      mockManualInbound.mockResolvedValue(undefined)
      const wrapper = createWrapper({ visible: true })
      await flushPromises()

      const vm = wrapper.vm as unknown as {
        handleSubmit: () => Promise<void>
        form: {
          containerNo: string
          containerStatus: 'heavy' | 'empty'
          customerName: string
        }
      }
      vm.form.containerNo = 'ABCD1234567'
      vm.form.containerStatus = 'empty'
      vm.form.customerName = '新客户'
      await vm.handleSubmit()

      const history = JSON.parse(localStorage.getItem('customer_history') || '[]')
      expect(history.length).toBe(20)
      expect(history[0]).toBe('新客户')
    })

    it('重复货主移到最前面', async () => {
      localStorage.setItem('customer_history', JSON.stringify(['客户A', '客户B', '客户C']))

      mockManualInbound.mockResolvedValue(undefined)
      const wrapper = createWrapper({ visible: true })
      await flushPromises()

      const vm = wrapper.vm as unknown as {
        handleSubmit: () => Promise<void>
        form: {
          containerNo: string
          containerStatus: 'heavy' | 'empty'
          customerName: string
        }
      }
      vm.form.containerNo = 'ABCD1234567'
      vm.form.containerStatus = 'empty'
      vm.form.customerName = '客户B'
      await vm.handleSubmit()

      const history = JSON.parse(localStorage.getItem('customer_history') || '[]')
      expect(history[0]).toBe('客户B')
      expect(history.filter((n: string) => n === '客户B').length).toBe(1)
    })

    it('空货主不保存到历史记录', async () => {
      mockManualInbound.mockResolvedValue(undefined)
      const wrapper = createWrapper({ visible: true })
      await flushPromises()

      const vm = wrapper.vm as unknown as {
        handleSubmit: () => Promise<void>
        form: {
          containerNo: string
          containerStatus: 'heavy' | 'empty'
          customerName: string
        }
      }
      vm.form.containerNo = 'ABCD1234567'
      vm.form.containerStatus = 'empty'
      vm.form.customerName = ''
      await vm.handleSubmit()

      const history = localStorage.getItem('customer_history')
      expect(history).toBeNull()
    })
  })
})
