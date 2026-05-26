import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { nextTick } from 'vue'
import type { Order } from '../types/order'
import { BusinessType, OrderStatus, ContainerType, ContainerStatus, DocumentType } from '../types/order'
import AddressDialog from '../components/AddressDialog.vue'

const mockGetRouteTemplate = vi.fn()
const mockCreateOrder = vi.fn()
const mockUpdateOrder = vi.fn()

vi.mock('../services/dispatchService', () => ({
  dispatchService: {
    getRouteTemplate: (...args: unknown[]) => mockGetRouteTemplate(...args),
    getAvailableResources: vi.fn().mockResolvedValue({ drivers: [], vehicles: [] }),
    getAddresses: vi.fn().mockResolvedValue({ items: [] }),
  },
}))

vi.mock('../stores/useDispatchStore', () => ({
  useDispatchStore: () => ({
    availableDrivers: [],
    availableVehicles: [],
    addresses: [],
    fetchAvailableResources: vi.fn(),
    fetchAddresses: vi.fn(),
    createOrder: (...args: unknown[]) => mockCreateOrder(...args),
    updateOrder: (...args: unknown[]) => mockUpdateOrder(...args),
  }),
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')
  return {
    ...actual,
    ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
  }
})

import OrderFormDialog from '../components/OrderFormDialog.vue'

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1',
    orderNo: 'T202605150001',
    status: OrderStatus.PENDING,
    customerName: '测试客户',
    customerPhone: '13800138000',
    originName: '上海港',
    destName: '昆山工厂',
    waypoints: [],
    containerNo: 'ABCD1234567',
    containerType: ContainerType.GP40,
    sealNo: 'SEAL001',
    businessType: BusinessType.HEAVY_TRANSPORT,
    containerStatus: ContainerStatus.HEAVY,
    documents: [DocumentType.PICKUP_ORDER],
    driverId: null,
    driverName: null,
    vehicleId: null,
    vehiclePlateNo: null,
    dispatcherId: 'u1',
    dispatcherName: null,
    remark: '备注',
    assignedAt: null,
    startedAt: null,
    completedAt: null,
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-05-15T00:00:00Z',
    ...overrides,
  }
}

function createWrapper(props: { visible?: boolean; mode?: 'create' | 'edit'; order?: Order | null } = {}) {
  return mount(OrderFormDialog, {
    props: {
      visible: true,
      mode: 'create',
      order: null,
      ...props,
    },
    global: {
      plugins: [ElementPlus],
      stubs: {
        ElDialog: {
          name: 'ElDialog',
          template: '<div class="el-dialog-stub"><slot /><slot name="footer" /></div>',
          props: ['modelValue', 'title', 'width', 'closeOnClickModal'],
        },
      },
    },
  })
}

describe('OrderFormDialog - 对话框标题', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('创建模式下标题为新建任务', async () => {
    const wrapper = createWrapper({ mode: 'create' })
    await nextTick()

    const dialog = wrapper.findComponent({ name: 'ElDialog' })
    expect(dialog.props('title')).toBe('新建任务')
  })

  it('编辑模式下 pending 状态标题为编辑任务', async () => {
    const wrapper = createWrapper({ mode: 'edit', order: makeOrder() })
    await nextTick()

    const dialog = wrapper.findComponent({ name: 'ElDialog' })
    expect(dialog.props('title')).toBe('编辑任务')
  })

  it('编辑模式下非 pending 状态标题为补充箱号封号', async () => {
    const wrapper = createWrapper({ mode: 'edit', order: makeOrder({ status: OrderStatus.ASSIGNED }) })
    await nextTick()

    const dialog = wrapper.findComponent({ name: 'ElDialog' })
    expect(dialog.props('title')).toBe('补充箱号封号')
  })
})

describe('OrderFormDialog - 业务类型选择自动填充路线', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('选择重箱运输后自动填充启运地、途径点、目的地', async () => {
    mockGetRouteTemplate.mockResolvedValue({
      originName: '上海港',
      waypoints: ['苏州物流园'],
      destName: '昆山工厂',
    })

    const wrapper = createWrapper()

    wrapper.vm.form.businessType = BusinessType.HEAVY_TRANSPORT
    await nextTick()
    await nextTick()

    expect(mockGetRouteTemplate).toHaveBeenCalledWith(BusinessType.HEAVY_TRANSPORT)
    expect(wrapper.vm.form.originName).toBe('上海港')
    expect(wrapper.vm.form.waypoints).toEqual(['苏州物流园'])
    expect(wrapper.vm.form.destName).toBe('昆山工厂')
  })

  it('选择空箱运输后自动填充启运地和目的地（无途径点）', async () => {
    mockGetRouteTemplate.mockResolvedValue({
      originName: '宁波港',
      waypoints: null,
      destName: '杭州仓库',
    })

    const wrapper = createWrapper()

    wrapper.vm.form.businessType = BusinessType.EMPTY_TRANSPORT
    await nextTick()
    await nextTick()

    expect(mockGetRouteTemplate).toHaveBeenCalledWith(BusinessType.EMPTY_TRANSPORT)
    expect(wrapper.vm.form.originName).toBe('宁波港')
    expect(wrapper.vm.form.waypoints).toEqual([])
    expect(wrapper.vm.form.destName).toBe('杭州仓库')
  })

  it('API 调用失败时表单字段保持不变', async () => {
    mockGetRouteTemplate.mockRejectedValue(new Error('网络错误'))

    const wrapper = createWrapper()

    wrapper.vm.form.businessType = BusinessType.HEAVY_TRANSPORT
    await nextTick()
    await nextTick()

    expect(wrapper.vm.form.originName).toBe('')
    expect(wrapper.vm.form.waypoints).toEqual([])
    expect(wrapper.vm.form.destName).toBe('')
  })
})

describe('OrderFormDialog - 切换业务类型时覆盖路线字段', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('启运地已填写时会被新模板覆盖', async () => {
    mockGetRouteTemplate.mockResolvedValue({
      originName: '上海港',
      waypoints: ['苏州物流园'],
      destName: '昆山工厂',
    })

    const wrapper = createWrapper()
    wrapper.vm.form.originName = '用户自定义启运地'

    wrapper.vm.form.businessType = BusinessType.HEAVY_TRANSPORT
    await nextTick()
    await nextTick()

    expect(wrapper.vm.form.originName).toBe('上海港')
    expect(wrapper.vm.form.destName).toBe('昆山工厂')
  })

  it('清空业务类型后路线规划也应清空', async () => {
    mockGetRouteTemplate.mockResolvedValue({
      originName: '上海港',
      waypoints: ['苏州物流园'],
      destName: '昆山工厂',
    })

    const wrapper = createWrapper()

    wrapper.vm.form.businessType = BusinessType.HEAVY_TRANSPORT
    await nextTick()
    await nextTick()

    expect(wrapper.vm.form.originName).toBe('上海港')

    wrapper.vm.form.businessType = ''
    await nextTick()
    await nextTick()

    expect(wrapper.vm.form.originName).toBe('')
    expect(wrapper.vm.form.waypoints).toEqual([])
    expect(wrapper.vm.form.destName).toBe('')
  })

  it('切换业务类型后路线规划跟随变化', async () => {
    mockGetRouteTemplate
      .mockResolvedValueOnce({
        originName: '上海港',
        waypoints: ['苏州物流园'],
        destName: '昆山工厂',
      })
      .mockResolvedValueOnce({
        originName: '宁波港',
        waypoints: null,
        destName: '杭州仓库',
      })

    const wrapper = createWrapper()

    wrapper.vm.form.businessType = BusinessType.HEAVY_TRANSPORT
    await nextTick()
    await nextTick()

    expect(wrapper.vm.form.originName).toBe('上海港')

    wrapper.vm.form.businessType = BusinessType.EMPTY_TRANSPORT
    await nextTick()
    await nextTick()

    expect(wrapper.vm.form.originName).toBe('宁波港')
    expect(wrapper.vm.form.destName).toBe('杭州仓库')
  })
})

describe('OrderFormDialog - 编辑模式下业务类型自动填充', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('Bug: 编辑模式下选择业务类型应自动填充路线', async () => {
    mockGetRouteTemplate.mockResolvedValue({
      originName: '上海港',
      waypoints: ['苏州物流园'],
      destName: '昆山工厂',
    })

    const wrapper = createWrapper({ mode: 'edit', order: makeOrder() })
    await nextTick()

    wrapper.vm.form.businessType = BusinessType.HEAVY_TRANSPORT
    await nextTick()
    await nextTick()

    expect(mockGetRouteTemplate).toHaveBeenCalledWith(BusinessType.HEAVY_TRANSPORT)
    expect(wrapper.vm.form.originName).toBe('上海港')
    expect(wrapper.vm.form.destName).toBe('昆山工厂')
  })

  it('编辑模式下切换业务类型应覆盖已有路线', async () => {
    mockGetRouteTemplate
      .mockResolvedValueOnce({
        originName: '上海港',
        waypoints: ['苏州物流园'],
        destName: '昆山工厂',
      })
      .mockResolvedValueOnce({
        originName: '宁波港',
        waypoints: null,
        destName: '杭州仓库',
      })

    const wrapper = createWrapper({ mode: 'edit', order: makeOrder() })
    await nextTick()

    wrapper.vm.form.businessType = BusinessType.HEAVY_TRANSPORT
    await nextTick()
    await nextTick()

    expect(wrapper.vm.form.originName).toBe('上海港')

    wrapper.vm.form.businessType = BusinessType.EMPTY_TRANSPORT
    await nextTick()
    await nextTick()

    expect(wrapper.vm.form.originName).toBe('宁波港')
    expect(wrapper.vm.form.destName).toBe('杭州仓库')
  })
})

describe('OrderFormDialog - 创建任务', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('验证通过后创建任务并触发 success 事件', async () => {
    const newOrder = makeOrder({ id: 'o2' })
    mockCreateOrder.mockResolvedValue(newOrder)

    const wrapper = createWrapper({ mode: 'create' })
    await nextTick()
    wrapper.vm.form.customerName = '新客户'
    wrapper.vm.form.originName = '上海港'
    wrapper.vm.form.destName = '昆山工厂'

    // mock ElForm.validate — 通过 ref 查找
    const formEl = wrapper.findComponent({ ref: 'formRef' })
    if (formEl.exists()) {
      formEl.vm.validate = vi.fn().mockResolvedValue(true)
    }

    const footer = wrapper.find('.order-form__footer')
    const buttons = footer.findAllComponents({ name: 'ElButton' })
    const createButton = buttons.find((btn: VueWrapper) => btn.text().includes('创建任务'))
    if (createButton) {
      await createButton.trigger('click')
    }
    await nextTick()
    await nextTick()
    await nextTick()

    expect(mockCreateOrder).toHaveBeenCalled()
    expect(wrapper.emitted('success')).toBeTruthy()
  })

  it('验证失败时不调用 createOrder', async () => {
    const wrapper = createWrapper({ mode: 'create' })
    await nextTick()

    const formEl = wrapper.findComponent({ ref: 'formRef' })
    if (formEl.exists()) {
      formEl.vm.validate = vi.fn().mockResolvedValue(false)
    }

    const footer = wrapper.find('.order-form__footer')
    const buttons = footer.findAllComponents({ name: 'ElButton' })
    const createButton = buttons.find((btn: VueWrapper) => btn.text().includes('创建任务'))
    if (createButton) {
      await createButton.trigger('click')
    }
    await nextTick()
    await nextTick()

    expect(mockCreateOrder).not.toHaveBeenCalled()
  })

  it('创建失败时不触发 success 事件', async () => {
    mockCreateOrder.mockRejectedValue(new Error('创建失败'))

    const wrapper = createWrapper({ mode: 'create' })
    await nextTick()
    wrapper.vm.form.customerName = '新客户'

    const formEl = wrapper.findComponent({ ref: 'formRef' })
    if (formEl.exists()) {
      formEl.vm.validate = vi.fn().mockResolvedValue(true)
    }

    const footer = wrapper.find('.order-form__footer')
    const buttons = footer.findAllComponents({ name: 'ElButton' })
    const createButton = buttons.find((btn: VueWrapper) => btn.text().includes('创建任务'))
    if (createButton) {
      await createButton.trigger('click')
    }
    await nextTick()
    await nextTick()

    expect(wrapper.emitted('success')).toBeFalsy()
  })
})

describe('OrderFormDialog - 创建并派车', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('创建并派车包含 driverId 和 vehicleId', async () => {
    const newOrder = makeOrder({ id: 'o2' })
    mockCreateOrder.mockResolvedValue(newOrder)

    const wrapper = createWrapper({ mode: 'create' })
    await nextTick()
    wrapper.vm.form.customerName = '新客户'
    wrapper.vm.form.driverId = 'd1'
    wrapper.vm.form.vehicleId = 'v1'
    await nextTick()

    const formEl = wrapper.findComponent({ ref: 'formRef' })
    if (formEl.exists()) {
      formEl.vm.validate = vi.fn().mockResolvedValue(true)
    }

    const footer = wrapper.find('.order-form__footer')
    const buttons = footer.findAllComponents({ name: 'ElButton' })
    const assignButton = buttons.find((btn: VueWrapper) => btn.text().includes('创建并派车'))
    if (assignButton) {
      await assignButton.trigger('click')
    }
    await nextTick()
    await nextTick()
    await nextTick()

    expect(mockCreateOrder).toHaveBeenCalled()
    const callData = mockCreateOrder.mock.calls[0][0]
    expect(callData.driverId).toBe('d1')
    expect(callData.vehicleId).toBe('v1')
    expect(wrapper.emitted('success')).toBeTruthy()
  })
})

describe('OrderFormDialog - 编辑任务', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('编辑模式下显示保存按钮', async () => {
    const wrapper = createWrapper({ mode: 'edit', order: makeOrder() })
    await nextTick()

    const footer = wrapper.find('.order-form__footer')
    expect(footer.text()).toContain('保存')
  })

  it('验证通过后更新任务并触发 success 事件', async () => {
    const updated = makeOrder({ customerName: '更新客户' })
    mockUpdateOrder.mockResolvedValue(updated)

    const wrapper = createWrapper({ mode: 'edit', order: makeOrder() })
    await nextTick()
    wrapper.vm.form.customerName = '更新客户'

    const formEl = wrapper.findComponent({ ref: 'formRef' })
    if (formEl.exists()) {
      formEl.vm.validate = vi.fn().mockResolvedValue(true)
    }

    const footer = wrapper.find('.order-form__footer')
    const buttons = footer.findAllComponents({ name: 'ElButton' })
    const saveButton = buttons.find((btn: VueWrapper) => btn.text().includes('保存'))
    if (saveButton) {
      await saveButton.trigger('click')
    }
    await nextTick()
    await nextTick()

    expect(mockUpdateOrder).toHaveBeenCalledWith('o1', expect.any(Object))
    expect(wrapper.emitted('success')).toBeTruthy()
  })

  it('编辑失败时不触发 success 事件', async () => {
    mockUpdateOrder.mockRejectedValue(new Error('编辑失败'))

    const wrapper = createWrapper({ mode: 'edit', order: makeOrder() })
    await nextTick()

    const formEl = wrapper.findComponent({ ref: 'formRef' })
    if (formEl.exists()) {
      formEl.vm.validate = vi.fn().mockResolvedValue(true)
    }

    const footer = wrapper.find('.order-form__footer')
    const buttons = footer.findAllComponents({ name: 'ElButton' })
    const saveButton = buttons.find((btn: VueWrapper) => btn.text().includes('保存'))
    if (saveButton) {
      await saveButton.trigger('click')
    }
    await nextTick()
    await nextTick()

    expect(wrapper.emitted('success')).toBeFalsy()
  })
})

describe('OrderFormDialog - 地址选择', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('选择起运地地址后更新 form.originName', async () => {
    const wrapper = createWrapper({ mode: 'create' })

    wrapper.vm.form.originName = ''
    const addressDialog = wrapper.findComponent(AddressDialog)
    if (addressDialog.exists()) {
      addressDialog.vm.$emit('select', '上海港', 'origin')
      await nextTick()

      expect(wrapper.vm.form.originName).toBe('上海港')
    }
  })

  it('选择目的地地址后更新 form.destName', async () => {
    const wrapper = createWrapper({ mode: 'create' })

    wrapper.vm.form.destName = ''
    const addressDialog = wrapper.findComponent(AddressDialog)
    if (addressDialog.exists()) {
      addressDialog.vm.$emit('select', '昆山工厂', 'dest')
      await nextTick()

      expect(wrapper.vm.form.destName).toBe('昆山工厂')
    }
  })
})

describe('OrderFormDialog - 关闭对话框', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('点击取消按钮关闭对话框', async () => {
    const wrapper = createWrapper({ mode: 'create' })

    const footer = wrapper.find('.order-form__footer')
    const buttons = footer.findAllComponents({ name: 'ElButton' })
    const cancelButton = buttons.find((btn: VueWrapper) => btn.text().includes('取消'))
    if (cancelButton) {
      await cancelButton.trigger('click')
    }
    await nextTick()

    expect(wrapper.emitted('update:visible')).toBeTruthy()
    expect(wrapper.emitted('update:visible')![0]).toEqual([false])
  })
})
