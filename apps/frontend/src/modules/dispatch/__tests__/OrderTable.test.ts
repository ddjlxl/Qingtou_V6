import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import type { Order } from '../types/order'
import { OrderStatus, ContainerType, BusinessType, ContainerStatus, DocumentType } from '../types/order'
import OrderTableBody from '../components/OrderTableBody.vue'
import OrderTableToolbar from '../components/OrderTableToolbar.vue'

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1',
    orderNo: 'T202605150001',
    status: OrderStatus.PENDING,
    customerName: '测试客户',
    customerPhone: '13800138000',
    originName: '上海港',
    destName: '昆山工厂',
    waypoints: null,
    containerNo: 'ABCD1234567',
    containerType: ContainerType.GP40,
    sealNo: null,
    businessType: BusinessType.HEAVY_TRANSPORT,
    containerStatus: ContainerStatus.HEAVY,
    documents: [DocumentType.PICKUP_ORDER],
    driverId: null,
    driverName: null,
    vehicleId: null,
    vehiclePlateNo: null,
    dispatcherId: 'u1',
    dispatcherName: null,
    remark: null,
    assignedAt: null,
    startedAt: null,
    completedAt: null,
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-05-15T00:00:00Z',
    ...overrides,
  }
}

const mockFetchOrders = vi.fn()
const mockSetTab = vi.fn()
const mockSetKeyword = vi.fn()
const mockSetPage = vi.fn()
const mockSetPageSize = vi.fn()

function createMockStore(overrides: Record<string, unknown> = {}) {
  return {
    orders: [makeOrder()],
    loading: false,
    error: null,
    activeTab: 'all' as const,
    keyword: '',
    page: 1,
    pageSize: 20,
    total: 1,
    statusCounts: {
      pending: 1,
      assigned: 0,
      transiting: 0,
      completed: 0,
      overdue: 0,
    },
    tabCounts: {
      all: 1,
      pending: 1,
      assigned: 0,
      transiting: 0,
      completed: 0,
      overdue: 0,
    },
    availableDrivers: [],
    availableVehicles: [],
    addresses: [],
    fetchOrders: mockFetchOrders,
    setTab: mockSetTab,
    setKeyword: mockSetKeyword,
    setPage: mockSetPage,
    setPageSize: mockSetPageSize,
    fetchAvailableResources: vi.fn(),
    fetchAddresses: vi.fn(),
    createOrder: vi.fn(),
    updateOrder: vi.fn(),
    deleteOrder: vi.fn(),
    assignOrder: vi.fn(),
    completeOrder: vi.fn(),
    createAddress: vi.fn(),
    deleteAddress: vi.fn(),
    ...overrides,
  }
}

let storeOverrides: Record<string, unknown> = {}

vi.mock('../stores/useDispatchStore', () => ({
  useDispatchStore: () => createMockStore(storeOverrides),
}))

import OrderTable from '../components/OrderTable.vue'

function createWrapper() {
  return mount(OrderTable, {
    global: {
      plugins: [ElementPlus],
    },
  })
}

describe('OrderTable - 正常数据渲染', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    storeOverrides = {}
  })

  it('渲染订单表格容器', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.order-table').exists()).toBe(true)
  })

  it('渲染标签页', () => {
    const wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'ElTabs' }).exists()).toBe(true)
  })

  it('有数据时渲染表格主体', () => {
    const wrapper = createWrapper()
    expect(wrapper.findComponent(OrderTableBody).exists()).toBe(true)
  })

  it('总数大于0时渲染分页组件', () => {
    const wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'ElPagination' }).exists()).toBe(true)
  })

  it('总数为0时不渲染分页组件', () => {
    storeOverrides = { orders: [], total: 0 }
    const wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'ElPagination' }).exists()).toBe(false)
  })
})

describe('OrderTable - 加载状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    storeOverrides = {}
  })

  it('加载中时显示加载提示', () => {
    storeOverrides = { loading: true, orders: [], total: 0 }
    const wrapper = createWrapper()

    expect(wrapper.find('.order-table__loading').exists()).toBe(true)
    expect(wrapper.text()).toContain('加载中')
  })

  it('加载中时不显示表格主体', () => {
    storeOverrides = { loading: true, orders: [], total: 0 }
    const wrapper = createWrapper()

    expect(wrapper.findComponent(OrderTableBody).exists()).toBe(false)
  })
})

describe('OrderTable - 错误状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    storeOverrides = {}
  })

  it('出错时显示错误信息和重试按钮', () => {
    storeOverrides = { loading: false, error: '网络错误', orders: [], total: 0 }
    const wrapper = createWrapper()

    expect(wrapper.find('.order-table__error').exists()).toBe(true)
    expect(wrapper.text()).toContain('网络错误')
  })

  it('点击重试按钮重新获取数据', async () => {
    storeOverrides = { loading: false, error: '网络错误', orders: [], total: 0 }
    const wrapper = createWrapper()

    const retryButton = wrapper.find('.order-table__error').findComponent({ name: 'ElButton' })
    await retryButton.trigger('click')

    expect(mockFetchOrders).toHaveBeenCalled()
  })
})

describe('OrderTable - 空数据状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    storeOverrides = {}
  })

  it('无数据时显示空状态提示', () => {
    storeOverrides = { loading: false, error: null, orders: [], total: 0 }
    const wrapper = createWrapper()

    expect(wrapper.find('.order-table__empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('暂无任务数据')
  })

  it('空状态下点击新建按钮触发 create 事件', async () => {
    storeOverrides = { loading: false, error: null, orders: [], total: 0 }
    const wrapper = createWrapper()

    const createButton = wrapper.find('.order-table__empty').findComponent({ name: 'ElButton' })
    await createButton.trigger('click')

    expect(wrapper.emitted('create')).toBeTruthy()
  })
})

describe('OrderTable - 工具栏交互', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    storeOverrides = {}
  })

  it('点击工具栏新建按钮触发 create 事件', async () => {
    const wrapper = createWrapper()
    const toolbar = wrapper.findComponent(OrderTableToolbar)

    await toolbar.vm.$emit('create')

    expect(wrapper.emitted('create')).toBeTruthy()
  })
})

describe('OrderTable - 表格主体事件透传', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    storeOverrides = {}
  })

  it('表格主体触发 edit 时透传给父组件', async () => {
    const wrapper = createWrapper()
    const body = wrapper.findComponent(OrderTableBody)
    const order = makeOrder()

    await body.vm.$emit('edit', order)

    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')![0]).toEqual([order])
  })

  it('表格主体触发 assign 时透传给父组件', async () => {
    const wrapper = createWrapper()
    const body = wrapper.findComponent(OrderTableBody)
    const order = makeOrder()

    await body.vm.$emit('assign', order)

    expect(wrapper.emitted('assign')).toBeTruthy()
    expect(wrapper.emitted('assign')![0]).toEqual([order])
  })

  it('表格主体触发 complete 时透传给父组件', async () => {
    const wrapper = createWrapper()
    const body = wrapper.findComponent(OrderTableBody)
    const order = makeOrder()

    await body.vm.$emit('complete', order)

    expect(wrapper.emitted('complete')).toBeTruthy()
    expect(wrapper.emitted('complete')![0]).toEqual([order])
  })

  it('表格主体触发 delete 时透传给父组件', async () => {
    const wrapper = createWrapper()
    const body = wrapper.findComponent(OrderTableBody)
    const order = makeOrder()

    await body.vm.$emit('delete', order)

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')![0]).toEqual([order])
  })
})

describe('OrderTable - 标签页切换', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    storeOverrides = {}
  })

  it('切换标签页时调用 store.setTab', async () => {
    const wrapper = createWrapper()
    const tabs = wrapper.findComponent({ name: 'ElTabs' })

    await tabs.vm.$emit('update:modelValue', OrderStatus.PENDING)

    expect(mockSetTab).toHaveBeenCalledWith(OrderStatus.PENDING)
  })

  it('切换到全部标签时调用 store.setTab', async () => {
    const wrapper = createWrapper()
    const tabs = wrapper.findComponent({ name: 'ElTabs' })

    await tabs.vm.$emit('update:modelValue', 'all')

    expect(mockSetTab).toHaveBeenCalledWith('all')
  })
})

describe('OrderTable - 分页交互', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    storeOverrides = {}
  })

  it('切换页码时调用 store.setPage', async () => {
    const wrapper = createWrapper()
    const pagination = wrapper.findComponent({ name: 'ElPagination' })

    await pagination.vm.$emit('current-change', 3)

    expect(mockSetPage).toHaveBeenCalledWith(3)
  })

  it('切换每页条数时调用 store.setPageSize', async () => {
    const wrapper = createWrapper()
    const pagination = wrapper.findComponent({ name: 'ElPagination' })

    await pagination.vm.$emit('size-change', 50)

    expect(mockSetPageSize).toHaveBeenCalledWith(50)
  })
})

describe('OrderTable - 搜索防抖', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    storeOverrides = {}
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('输入关键词后防抖调用 store.setKeyword', async () => {
    const wrapper = createWrapper()
    const toolbar = wrapper.findComponent(OrderTableToolbar)

    await toolbar.vm.$emit('update:keyword', '测试')
    vi.advanceTimersByTime(300)

    expect(mockSetKeyword).toHaveBeenCalledWith('测试')
  })

  it('多次输入只触发最后一次搜索', async () => {
    const wrapper = createWrapper()
    const toolbar = wrapper.findComponent(OrderTableToolbar)

    await toolbar.vm.$emit('update:keyword', '测')
    await toolbar.vm.$emit('update:keyword', '测试')
    await toolbar.vm.$emit('update:keyword', '测试客')
    vi.advanceTimersByTime(300)

    expect(mockSetKeyword).toHaveBeenCalledTimes(1)
    expect(mockSetKeyword).toHaveBeenCalledWith('测试客')
  })
})
