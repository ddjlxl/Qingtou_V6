import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { setActivePinia, createPinia } from 'pinia'
import DriverWorkbench from '../pages/DriverWorkbench.vue'
import { OrderStatus } from '@/modules/dispatch'
import type { DriverOrder } from '../types'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

const mockFetchOrders = vi.fn()
const mockLoadMore = vi.fn()
const mockSetTab = vi.fn()
const mockSetPage = vi.fn()

const mockStore = {
  orders: [] as DriverOrder[],
  loading: false,
  loadingMore: false,
  error: null,
  page: 1,
  pageSize: 20,
  total: 0,
  activeTab: 'all' as OrderStatus | 'all',
  statusCounts: {
    pending: 0,
    assigned: 0,
    transiting: 0,
    completed: 0,
    overdue: 0,
  },
  hasMore: false,
  tabCounts: {
    all: 0,
    pending: 0,
    assigned: 0,
    transiting: 0,
    completed: 0,
    overdue: 0,
  },
  fetchOrders: mockFetchOrders,
  loadMore: mockLoadMore,
  setTab: mockSetTab,
  setPage: mockSetPage,
}

vi.mock('../stores/useDriverStore', () => ({
  useDriverStore: () => mockStore,
}))

vi.mock('@/shared/components', () => ({
  EmptyState: {
    template: '<div class="empty-state-stub" />',
    props: ['icon', 'title', 'description'],
  },
  LoadingSpinner: {
    template: '<div class="loading-spinner-stub" />',
    props: ['text'],
  },
}))

function makeOrder(overrides: Partial<DriverOrder> = {}): DriverOrder {
  return {
    id: 'order-1',
    orderNo: 'ORD-001',
    status: OrderStatus.ASSIGNED,
    customerName: '测试客户',
    customerPhone: '13800138000',
    originName: '起运地',
    destName: '目的地',
    waypoints: null,
    containerNo: 'ABCD1234567',
    containerType: null,
    sealNo: null,
    businessType: null,
    containerStatus: null,
    documents: null,
    driverId: 'driver-1',
    driverName: '测试司机',
    vehicleId: 'vehicle-1',
    vehiclePlateNo: '粤A12345',
    dispatcherId: 'dispatcher-1',
    dispatcherName: '调度员',
    remark: null,
    assignedAt: '2026-05-25T10:00:00Z',
    startedAt: null,
    completedAt: null,
    createdAt: '2026-05-25T08:00:00Z',
    updatedAt: '2026-05-25T08:00:00Z',
    ...overrides,
  }
}

function createWrapper() {
  return mount(DriverWorkbench, {
    global: {
      plugins: [ElementPlus],
      stubs: {
        DriverOrderCard: {
          template: '<div class="driver-order-card-stub" />',
          props: ['order'],
        },
      },
    },
  })
}

describe('DriverWorkbench', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockStore.orders = []
    mockStore.loading = false
    mockStore.loadingMore = false
    mockStore.total = 0
    mockStore.activeTab = 'all'
    mockStore.hasMore = false
    mockStore.tabCounts = {
      all: 0,
      pending: 0,
      assigned: 0,
      transiting: 0,
      completed: 0,
      overdue: 0,
    }
  })

  describe('页面加载', () => {
    it('onMounted 调用 store.fetchOrders()', async () => {
      createWrapper()
      await flushPromises()
      expect(mockFetchOrders).toHaveBeenCalled()
    })

    it('显示标题"我的任务"', async () => {
      const wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.text()).toContain('我的任务')
    })
  })

  describe('加载状态', () => {
    it('loading=true 时显示加载动画', async () => {
      mockStore.loading = true
      const wrapper = createWrapper()
      await flushPromises()
      const content = wrapper.find('.driver-workbench__content')
      expect(content.exists()).toBe(true)
    })

    it('loading=false 时不显示加载动画', async () => {
      mockStore.loading = false
      const wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.find('.driver-workbench__content').exists()).toBe(true)
    })
  })

  describe('空状态', () => {
    it('无订单时显示空状态', async () => {
      mockStore.orders = []
      mockStore.loading = false
      const wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.find('.empty-state-stub').exists()).toBe(true)
    })

    it('有订单时不显示空状态', async () => {
      mockStore.orders = [makeOrder()]
      mockStore.loading = false
      const wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.find('.empty-state-stub').exists()).toBe(false)
    })
  })

  describe('订单列表', () => {
    it('显示订单列表', async () => {
      mockStore.orders = [makeOrder(), makeOrder({ id: 'order-2' })]
      const wrapper = createWrapper()
      await flushPromises()
      const cards = wrapper.findAll('.driver-order-card-stub')
      expect(cards.length).toBe(2)
    })
  })

  describe('状态筛选', () => {
    it('显示状态 Tab', async () => {
      const wrapper = createWrapper()
      await flushPromises()
      const radioGroup = wrapper.findComponent({ name: 'ElRadioGroup' })
      expect(radioGroup.exists()).toBe(true)
    })

    it('切换 Tab 调用 store.setTab', async () => {
      const wrapper = createWrapper()
      await flushPromises()
      const radioGroup = wrapper.findComponent({ name: 'ElRadioGroup' })
      await radioGroup.vm.$emit('change', OrderStatus.ASSIGNED)
      expect(mockSetTab).toHaveBeenCalledWith(OrderStatus.ASSIGNED)
    })

    it('显示各状态的数量', async () => {
      mockStore.tabCounts = {
        all: 10,
        pending: 0,
        assigned: 3,
        transiting: 5,
        completed: 2,
        overdue: 0,
      }
      const wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.text()).toContain('(10)')
      expect(wrapper.text()).toContain('(3)')
      expect(wrapper.text()).toContain('(5)')
      expect(wrapper.text()).toContain('(2)')
    })
  })

  describe('分页', () => {
    it('total > pageSize 时显示分页', async () => {
      mockStore.orders = [makeOrder()]
      mockStore.total = 50
      mockStore.pageSize = 20
      const wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.findComponent({ name: 'ElPagination' }).exists()).toBe(true)
    })

    it('total <= pageSize 时不显示分页', async () => {
      mockStore.orders = [makeOrder()]
      mockStore.total = 10
      mockStore.pageSize = 20
      const wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.findComponent({ name: 'ElPagination' }).exists()).toBe(false)
    })

    it('切换页码调用 store.setPage', async () => {
      mockStore.orders = [makeOrder()]
      mockStore.total = 50
      mockStore.pageSize = 20
      const wrapper = createWrapper()
      await flushPromises()
      const pagination = wrapper.findComponent({ name: 'ElPagination' })
      await pagination.vm.$emit('current-change', 2)
      expect(mockSetPage).toHaveBeenCalledWith(2)
    })
  })
})
