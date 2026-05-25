import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { setActivePinia, createPinia } from 'pinia'
import ImportInboundDialog from '../components/ImportInboundDialog.vue'
import type { UploadFile } from 'element-plus'

const mockImportInbound = vi.fn()

vi.mock('../stores/useWarehouseStore', () => ({
  useWarehouseStore: () => ({
    importInbound: mockImportInbound,
  }),
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  }
})

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(ImportInboundDialog, {
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

function makeUploadFile(name: string): UploadFile {
  return {
    name,
    raw: new File([''], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
  } as UploadFile
}

describe('ImportInboundDialog', () => {
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

    it('显示标题"导入入库"', () => {
      const wrapper = createWrapper({ visible: true })
      const dialog = wrapper.findComponent({ name: 'ElDialog' })
      expect(dialog.props('title')).toBe('导入入库')
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

  describe('文件上传', () => {
    it('handleUpload 非 xlsx 文件显示错误', async () => {
      const { ElMessage } = await import('element-plus')
      const wrapper = createWrapper({ visible: true })
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleUpload: (file: UploadFile) => Promise<void> }
      const file = makeUploadFile('test.txt')
      await vm.handleUpload(file)

      expect(ElMessage.error).toHaveBeenCalledWith('仅支持 .xlsx 文件')
    })

    it('handleUpload 调用 store.importInbound', async () => {
      mockImportInbound.mockResolvedValue({ storedCount: 5, errors: [] })
      const wrapper = createWrapper({ visible: true, zoneCode: 'B' })
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleUpload: (file: UploadFile) => Promise<void> }
      const file = makeUploadFile('test.xlsx')
      await vm.handleUpload(file)

      expect(mockImportInbound).toHaveBeenCalledWith('B', file.raw)
    })

    it('handleUpload 成功后显示成功消息', async () => {
      const { ElMessage } = await import('element-plus')
      mockImportInbound.mockResolvedValue({ storedCount: 5, errors: [] })
      const wrapper = createWrapper({ visible: true })
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleUpload: (file: UploadFile) => Promise<void> }
      const file = makeUploadFile('test.xlsx')
      await vm.handleUpload(file)

      expect(ElMessage.success).toHaveBeenCalledWith('成功入库 5 条')
    })

    it('handleUpload 部分成功显示警告消息', async () => {
      const { ElMessage } = await import('element-plus')
      mockImportInbound.mockResolvedValue({ storedCount: 3, errors: ['错误1', '错误2'] })
      const wrapper = createWrapper({ visible: true })
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleUpload: (file: UploadFile) => Promise<void> }
      const file = makeUploadFile('test.xlsx')
      await vm.handleUpload(file)

      expect(ElMessage.warning).toHaveBeenCalledWith('入库完成，3 条成功，2 条失败')
    })

    it('handleUpload 成功后关闭弹窗', async () => {
      mockImportInbound.mockResolvedValue({ storedCount: 5, errors: [] })
      const wrapper = createWrapper({ visible: true })
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleUpload: (file: UploadFile) => Promise<void> }
      const file = makeUploadFile('test.xlsx')
      await vm.handleUpload(file)

      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')![0][0]).toBe(false)
    })

    it('handleUpload 失败后显示错误消息', async () => {
      const { ElMessage } = await import('element-plus')
      mockImportInbound.mockRejectedValue(new Error('网络错误'))
      const wrapper = createWrapper({ visible: true })
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleUpload: (file: UploadFile) => Promise<void> }
      const file = makeUploadFile('test.xlsx')
      await vm.handleUpload(file)

      expect(ElMessage.error).toHaveBeenCalledWith('网络错误')
    })

    it('handleUpload 失败后不关闭弹窗', async () => {
      mockImportInbound.mockRejectedValue(new Error('导入失败'))
      const wrapper = createWrapper({ visible: true })
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleUpload: (file: UploadFile) => Promise<void> }
      const file = makeUploadFile('test.xlsx')
      await vm.handleUpload(file)

      expect(wrapper.emitted('update:visible')).toBeFalsy()
    })

    it('handleUpload 无 raw 文件时不调用 API', async () => {
      const wrapper = createWrapper({ visible: true })
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleUpload: (file: UploadFile) => Promise<void> }
      const file = { name: 'test.xlsx' } as UploadFile
      await vm.handleUpload(file)

      expect(mockImportInbound).not.toHaveBeenCalled()
    })
  })

  describe('文件超出限制', () => {
    it('handleExceed 显示警告消息', async () => {
      const { ElMessage } = await import('element-plus')
      const wrapper = createWrapper({ visible: true })
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleExceed: () => void }
      vm.handleExceed()

      expect(ElMessage.warning).toHaveBeenCalledWith('只能上传一个文件，请先移除已有文件')
    })
  })
})
