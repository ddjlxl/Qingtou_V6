import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'

const mockFetchOrders = vi.fn()
const mockSetTab = vi.fn()
const mockSetKeyword = vi.fn()
const mockSetPage = vi.fn()
const mockSetPageSize = vi.fn()

const defaultStoreState = {
  orders: [
    {
      id: 'o1',
      orderNo: 'T202605150001',
      status: 'pending',
      customerName: '测试客户',
      customerPhone: '13800138000',
      originName: '上海港',
      destName: '昆山工厂',
      waypoints: null,
      containerNo: 'ABCD1234567',
      containerType: '40GP',
      sealNo: null,
      businessType: 'heavy_transport',
      documents: ['pickup_order'],
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
    },
  ],
  loading: false,
  error: null,
  activeTab: 'all',
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
  fetchOrders: mockFetchOrders,
  setTab: mockSetTab,
  setKeyword: mockSetKeyword,
  setPage: mockSetPage,
  setPageSize: mockSetPageSize,
}

vi.mock('../stores/useDispatchStore', () => ({
  useDispatchStore: () => ({ ...defaultStoreState }),
}))

import OrderTable from '../components/OrderTable.vue'

function createWrapper() {
  return mount(OrderTable, {
    global: {
      plugins: [ElementPlus],
    },
  })
}

describe('OrderTable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders order table container', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.order-table').exists()).toBe(true)
  })

  it('renders tabs', () => {
    const wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'ElTabs' }).exists()).toBe(true)
  })

  it('renders order table body', () => {
    const wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'OrderTableBody' }).exists()).toBe(true)
  })

  it('renders pagination when total > 0', () => {
    const wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'ElPagination' }).exists()).toBe(true)
  })

  it('emits create event on toolbar create', async () => {
    const wrapper = createWrapper()
    const toolbar = wrapper.findComponent({ name: 'OrderTableToolbar' })
    await toolbar.vm.$emit('create')
    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('emits edit event from body', async () => {
    const wrapper = createWrapper()
    const body = wrapper.findComponent({ name: 'OrderTableBody' })
    const order = defaultStoreState.orders[0]
    await body.vm.$emit('edit', order)
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')![0]).toEqual([order])
  })

  it('emits assign event from body', async () => {
    const wrapper = createWrapper()
    const body = wrapper.findComponent({ name: 'OrderTableBody' })
    const order = defaultStoreState.orders[0]
    await body.vm.$emit('assign', order)
    expect(wrapper.emitted('assign')).toBeTruthy()
  })

  it('emits complete event from body', async () => {
    const wrapper = createWrapper()
    const body = wrapper.findComponent({ name: 'OrderTableBody' })
    const order = defaultStoreState.orders[0]
    await body.vm.$emit('complete', order)
    expect(wrapper.emitted('complete')).toBeTruthy()
  })

  it('emits delete event from body', async () => {
    const wrapper = createWrapper()
    const body = wrapper.findComponent({ name: 'OrderTableBody' })
    const order = defaultStoreState.orders[0]
    await body.vm.$emit('delete', order)
    expect(wrapper.emitted('delete')).toBeTruthy()
  })
})