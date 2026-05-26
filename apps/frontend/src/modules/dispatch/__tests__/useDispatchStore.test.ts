import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Order, OrderListResponse } from '../types/order'
import { OrderStatus } from '../types/order'

const mockGetOrders = vi.fn()
const mockCreateOrder = vi.fn()
const mockUpdateOrder = vi.fn()
const mockDeleteOrder = vi.fn()
const mockAssignOrder = vi.fn()
const mockCompleteOrder = vi.fn()
const mockGetAvailableResources = vi.fn()
const mockGetAddresses = vi.fn()
const mockCreateAddress = vi.fn()
const mockDeleteAddress = vi.fn()

vi.mock('../services/dispatchService', () => ({
  dispatchService: {
    getOrders: (...args: unknown[]) => mockGetOrders(...args),
    createOrder: (...args: unknown[]) => mockCreateOrder(...args),
    updateOrder: (...args: unknown[]) => mockUpdateOrder(...args),
    deleteOrder: (...args: unknown[]) => mockDeleteOrder(...args),
    assignOrder: (...args: unknown[]) => mockAssignOrder(...args),
    completeOrder: (...args: unknown[]) => mockCompleteOrder(...args),
    getAvailableResources: (...args: unknown[]) => mockGetAvailableResources(...args),
    getAddresses: (...args: unknown[]) => mockGetAddresses(...args),
    createAddress: (...args: unknown[]) => mockCreateAddress(...args),
    deleteAddress: (...args: unknown[]) => mockDeleteAddress(...args),
  },
}))

import { useDispatchStore } from '../stores/useDispatchStore'

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1',
    orderNo: 'T202605150001',
    status: OrderStatus.PENDING,
    customerName: null,
    customerPhone: null,
    originName: null,
    destName: null,
    waypoints: null,
    containerNo: null,
    containerType: null,
    sealNo: null,
    businessType: null,
    containerStatus: null,
    documents: null,
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

function makeOrderListResponse(overrides: Partial<OrderListResponse> = {}): OrderListResponse {
  return {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    statusCounts: {
      pending: 0,
      assigned: 0,
      transiting: 0,
      completed: 0,
      overdue: 0,
    },
    ...overrides,
  }
}

describe('useDispatchStore - 初始状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('orders 为空数组', () => {
    const store = useDispatchStore()
    expect(store.orders).toEqual([])
  })

  it('loading 为 false', () => {
    const store = useDispatchStore()
    expect(store.loading).toBe(false)
  })

  it('error 为 null', () => {
    const store = useDispatchStore()
    expect(store.error).toBeNull()
  })

  it('activeTab 为 all', () => {
    const store = useDispatchStore()
    expect(store.activeTab).toBe('all')
  })

  it('keyword 为空', () => {
    const store = useDispatchStore()
    expect(store.keyword).toBe('')
  })

  it('page 为 1', () => {
    const store = useDispatchStore()
    expect(store.page).toBe(1)
  })

  it('pageSize 为 20', () => {
    const store = useDispatchStore()
    expect(store.pageSize).toBe(20)
  })

  it('total 为 0', () => {
    const store = useDispatchStore()
    expect(store.total).toBe(0)
  })

  it('statusCounts 全部为 0', () => {
    const store = useDispatchStore()
    expect(store.statusCounts).toEqual({
      pending: 0,
      assigned: 0,
      transiting: 0,
      completed: 0,
      overdue: 0,
    })
  })

  it('availableDrivers 为空', () => {
    const store = useDispatchStore()
    expect(store.availableDrivers).toEqual([])
  })

  it('availableVehicles 为空', () => {
    const store = useDispatchStore()
    expect(store.availableVehicles).toEqual([])
  })

  it('addresses 为空', () => {
    const store = useDispatchStore()
    expect(store.addresses).toEqual([])
  })
})

describe('useDispatchStore - tabCounts 计算属性', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('根据 statusCounts 和 total 计算 tabCounts', () => {
    const store = useDispatchStore()
    store.total = 10
    store.statusCounts = {
      pending: 3,
      assigned: 2,
      transiting: 1,
      completed: 3,
      overdue: 1,
    }

    expect(store.tabCounts).toEqual({
      all: 10,
      pending: 3,
      assigned: 2,
      transiting: 1,
      completed: 3,
      overdue: 1,
    })
  })
})

describe('useDispatchStore - fetchOrders', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('加载订单数据到 state', async () => {
    const store = useDispatchStore()
    const orders = [makeOrder(), makeOrder({ id: 'o2', orderNo: 'T202605150002' })]
    mockGetOrders.mockResolvedValue(makeOrderListResponse({
      items: orders,
      total: 2,
      statusCounts: { pending: 2, assigned: 0, transiting: 0, completed: 0, overdue: 0 },
    }))

    await store.fetchOrders()

    expect(store.orders).toEqual(orders)
    expect(store.total).toBe(2)
    expect(store.statusCounts.pending).toBe(2)
    expect(store.loading).toBe(false)
  })

  it('失败时设置 error 并停止加载', async () => {
    const store = useDispatchStore()
    mockGetOrders.mockRejectedValue(new Error('网络错误'))

    await store.fetchOrders()

    expect(store.error).toBe('网络错误')
    expect(store.loading).toBe(false)
  })

  it('非 all 标签时传递 status 过滤参数', async () => {
    const store = useDispatchStore()
    store.activeTab = OrderStatus.PENDING
    mockGetOrders.mockResolvedValue(makeOrderListResponse())

    await store.fetchOrders()

    expect(mockGetOrders).toHaveBeenCalledWith({
      page: 1,
      page_size: 20,
      status: OrderStatus.PENDING,
    })
  })

  it('有搜索关键词时传递 keyword 参数', async () => {
    const store = useDispatchStore()
    store.keyword = '测试'
    mockGetOrders.mockResolvedValue(makeOrderListResponse())

    await store.fetchOrders()

    expect(mockGetOrders).toHaveBeenCalledWith({
      page: 1,
      page_size: 20,
      keyword: '测试',
    })
  })
})

describe('useDispatchStore - createOrder', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('创建订单后刷新列表', async () => {
    const store = useDispatchStore()
    const newOrder = makeOrder({ id: 'o1', customerName: '新客户' })
    mockCreateOrder.mockResolvedValue(newOrder)
    mockGetOrders.mockResolvedValue(makeOrderListResponse({ items: [newOrder], total: 1 }))

    const result = await store.createOrder({ customerName: '新客户' })

    expect(result).toEqual(newOrder)
    expect(mockCreateOrder).toHaveBeenCalledWith({ customerName: '新客户' })
    expect(mockGetOrders).toHaveBeenCalled()
  })

  it('失败时设置 error 并抛出异常', async () => {
    const store = useDispatchStore()
    mockCreateOrder.mockRejectedValue(new Error('创建失败'))

    await expect(store.createOrder({})).rejects.toThrow('创建失败')
    expect(store.error).toBe('创建失败')
  })
})

describe('useDispatchStore - updateOrder', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('更新订单后刷新列表', async () => {
    const store = useDispatchStore()
    const updated = makeOrder({ id: 'o1', customerName: '更新后' })
    mockUpdateOrder.mockResolvedValue(updated)
    mockGetOrders.mockResolvedValue(makeOrderListResponse({ items: [updated], total: 1 }))

    const result = await store.updateOrder('o1', { customerName: '更新后' })

    expect(result).toEqual(updated)
    expect(mockUpdateOrder).toHaveBeenCalledWith('o1', { customerName: '更新后' })
  })

  it('失败时设置 error 并抛出异常', async () => {
    const store = useDispatchStore()
    mockUpdateOrder.mockRejectedValue(new Error('编辑失败'))

    await expect(store.updateOrder('o1', {})).rejects.toThrow('编辑失败')
    expect(store.error).toBe('编辑失败')
  })
})

describe('useDispatchStore - deleteOrder', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('删除订单后刷新列表', async () => {
    const store = useDispatchStore()
    mockDeleteOrder.mockResolvedValue(undefined)
    mockGetOrders.mockResolvedValue(makeOrderListResponse())

    await store.deleteOrder('o1')

    expect(mockDeleteOrder).toHaveBeenCalledWith('o1')
    expect(mockGetOrders).toHaveBeenCalled()
  })

  it('失败时设置 error 并抛出异常', async () => {
    const store = useDispatchStore()
    mockDeleteOrder.mockRejectedValue(new Error('删除失败'))

    await expect(store.deleteOrder('o1')).rejects.toThrow('删除失败')
    expect(store.error).toBe('删除失败')
  })
})

describe('useDispatchStore - assignOrder', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('分配订单后刷新列表', async () => {
    const store = useDispatchStore()
    const assigned = makeOrder({
      id: 'o1',
      status: OrderStatus.ASSIGNED,
      driverId: 'd1',
      driverName: '张三',
      vehicleId: 'v1',
      vehiclePlateNo: '粤A12345',
    })
    mockAssignOrder.mockResolvedValue(assigned)
    mockGetOrders.mockResolvedValue(makeOrderListResponse({ items: [assigned], total: 1 }))

    const result = await store.assignOrder('o1', { driverId: 'd1', vehicleId: 'v1' })

    expect(result).toEqual(assigned)
    expect(mockGetOrders).toHaveBeenCalled()
  })

  it('失败时设置 error 并抛出异常', async () => {
    const store = useDispatchStore()
    mockAssignOrder.mockRejectedValue(new Error('分配失败'))

    await expect(store.assignOrder('o1', { driverId: 'd1', vehicleId: 'v1' })).rejects.toThrow('分配失败')
    expect(store.error).toBe('分配失败')
  })
})

describe('useDispatchStore - completeOrder', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('完成订单后刷新列表', async () => {
    const store = useDispatchStore()
    const completed = makeOrder({ id: 'o1', status: OrderStatus.COMPLETED })
    mockCompleteOrder.mockResolvedValue(completed)
    mockGetOrders.mockResolvedValue(makeOrderListResponse({ items: [completed], total: 1 }))

    const result = await store.completeOrder('o1')

    expect(result).toEqual(completed)
    expect(mockCompleteOrder).toHaveBeenCalledWith('o1')
  })

  it('失败时设置 error 并抛出异常', async () => {
    const store = useDispatchStore()
    mockCompleteOrder.mockRejectedValue(new Error('标记完成失败'))

    await expect(store.completeOrder('o1')).rejects.toThrow('标记完成失败')
    expect(store.error).toBe('标记完成失败')
  })
})

describe('useDispatchStore - fetchAvailableResources', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('加载可用司机和车辆到 state', async () => {
    const store = useDispatchStore()
    mockGetAvailableResources.mockResolvedValue({
      drivers: [{ id: 'd1', name: '张三', phone: '13800138000', boundVehiclePlateNo: null }],
      vehicles: [{ id: 'v1', plateNo: '粤A12345', boundDriverName: null }],
    })

    await store.fetchAvailableResources()

    expect(store.availableDrivers).toHaveLength(1)
    expect(store.availableDrivers[0].name).toBe('张三')
    expect(store.availableVehicles).toHaveLength(1)
    expect(store.availableVehicles[0].plateNo).toBe('粤A12345')
  })

  it('失败时设置 error', async () => {
    const store = useDispatchStore()
    mockGetAvailableResources.mockRejectedValue(new Error('获取失败'))

    await store.fetchAvailableResources()

    expect(store.error).toBe('获取失败')
  })
})

describe('useDispatchStore - fetchAddresses', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('加载地址到 state', async () => {
    const store = useDispatchStore()
    mockGetAddresses.mockResolvedValue({
      items: [
        { id: 'a1', name: '上海港', createdAt: '2026-01-01T00:00:00Z' },
        { id: 'a2', name: '宁波港', createdAt: '2026-01-02T00:00:00Z' },
      ],
    })

    await store.fetchAddresses()

    expect(store.addresses).toHaveLength(2)
    expect(store.addresses[0].name).toBe('上海港')
  })

  it('失败时设置 error', async () => {
    const store = useDispatchStore()
    mockGetAddresses.mockRejectedValue(new Error('获取失败'))

    await store.fetchAddresses()

    expect(store.error).toBe('获取失败')
  })
})

describe('useDispatchStore - createAddress', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('创建地址后添加到列表头部', async () => {
    const store = useDispatchStore()
    store.addresses = [{ id: 'a1', name: '宁波港', createdAt: '2026-01-01T00:00:00Z' }]
    const newAddress = { id: 'a2', name: '上海港', createdAt: '2026-01-02T00:00:00Z' }
    mockCreateAddress.mockResolvedValue(newAddress)

    const result = await store.createAddress('上海港')

    expect(result).toEqual(newAddress)
    expect(store.addresses).toHaveLength(2)
    expect(store.addresses[0].name).toBe('上海港')
  })

  it('失败时设置 error 并抛出异常', async () => {
    const store = useDispatchStore()
    mockCreateAddress.mockRejectedValue(new Error('新增失败'))

    await expect(store.createAddress('上海港')).rejects.toThrow('新增失败')
    expect(store.error).toBe('新增失败')
  })
})

describe('useDispatchStore - deleteAddress', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('删除地址后从列表移除', async () => {
    const store = useDispatchStore()
    store.addresses = [
      { id: 'a1', name: '上海港', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'a2', name: '宁波港', createdAt: '2026-01-02T00:00:00Z' },
    ]
    mockDeleteAddress.mockResolvedValue(undefined)

    await store.deleteAddress('a1')

    expect(store.addresses).toHaveLength(1)
    expect(store.addresses[0].id).toBe('a2')
  })

  it('失败时设置 error 并抛出异常', async () => {
    const store = useDispatchStore()
    mockDeleteAddress.mockRejectedValue(new Error('删除失败'))

    await expect(store.deleteAddress('a1')).rejects.toThrow('删除失败')
    expect(store.error).toBe('删除失败')
  })
})

describe('useDispatchStore - setTab', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('切换标签页并重置页码为 1', async () => {
    const store = useDispatchStore()
    store.page = 3
    mockGetOrders.mockResolvedValue(makeOrderListResponse())

    store.setTab(OrderStatus.ASSIGNED)

    expect(store.activeTab).toBe(OrderStatus.ASSIGNED)
    expect(store.page).toBe(1)
  })
})

describe('useDispatchStore - setKeyword', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('设置关键词并重置页码为 1', async () => {
    const store = useDispatchStore()
    store.page = 5
    mockGetOrders.mockResolvedValue(makeOrderListResponse())

    store.setKeyword('测试')

    expect(store.keyword).toBe('测试')
    expect(store.page).toBe(1)
  })
})

describe('useDispatchStore - setPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('设置页码并重新获取数据', async () => {
    const store = useDispatchStore()
    mockGetOrders.mockResolvedValue(makeOrderListResponse())

    store.setPage(3)

    expect(store.page).toBe(3)
    expect(mockGetOrders).toHaveBeenCalled()
  })
})

describe('useDispatchStore - setPageSize', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('设置每页条数并重置页码为 1', async () => {
    const store = useDispatchStore()
    store.page = 3
    mockGetOrders.mockResolvedValue(makeOrderListResponse())

    store.setPageSize(50)

    expect(store.pageSize).toBe(50)
    expect(store.page).toBe(1)
  })
})
