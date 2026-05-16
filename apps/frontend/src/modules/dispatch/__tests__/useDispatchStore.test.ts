import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

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
import { OrderStatus } from '../types/order'

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'o1',
    orderNo: 'DD202605150001',
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

function makeOrderListResponse(overrides: Record<string, unknown> = {}) {
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

describe('useDispatchStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has empty orders array', () => {
      const store = useDispatchStore()
      expect(store.orders).toEqual([])
    })

    it('has loading as false', () => {
      const store = useDispatchStore()
      expect(store.loading).toBe(false)
    })

    it('has error as null', () => {
      const store = useDispatchStore()
      expect(store.error).toBeNull()
    })

    it('has activeTab as all', () => {
      const store = useDispatchStore()
      expect(store.activeTab).toBe('all')
    })

    it('has empty keyword', () => {
      const store = useDispatchStore()
      expect(store.keyword).toBe('')
    })

    it('has page as 1', () => {
      const store = useDispatchStore()
      expect(store.page).toBe(1)
    })

    it('has pageSize as 20', () => {
      const store = useDispatchStore()
      expect(store.pageSize).toBe(20)
    })

    it('has total as 0', () => {
      const store = useDispatchStore()
      expect(store.total).toBe(0)
    })

    it('has zero status counts', () => {
      const store = useDispatchStore()
      expect(store.statusCounts).toEqual({
        pending: 0,
        assigned: 0,
        transiting: 0,
        completed: 0,
        overdue: 0,
      })
    })

    it('has empty available drivers', () => {
      const store = useDispatchStore()
      expect(store.availableDrivers).toEqual([])
    })

    it('has empty available vehicles', () => {
      const store = useDispatchStore()
      expect(store.availableVehicles).toEqual([])
    })

    it('has empty addresses', () => {
      const store = useDispatchStore()
      expect(store.addresses).toEqual([])
    })
  })

  describe('tabCounts computed', () => {
    it('computes tab counts from statusCounts and total', () => {
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

  describe('fetchOrders', () => {
    it('loads orders into state', async () => {
      const store = useDispatchStore()
      const orders = [makeOrder(), makeOrder({ id: 'o2', orderNo: 'DD202605150002' })]
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

    it('sets error on failure', async () => {
      const store = useDispatchStore()
      mockGetOrders.mockRejectedValue(new Error('网络错误'))

      await store.fetchOrders()

      expect(store.error).toBe('网络错误')
      expect(store.loading).toBe(false)
    })

    it('passes status filter when tab is not all', async () => {
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

    it('passes keyword filter', async () => {
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

  describe('createOrder', () => {
    it('creates order and refreshes list', async () => {
      const store = useDispatchStore()
      const newOrder = makeOrder({ id: 'o1', customerName: '新客户' })
      mockCreateOrder.mockResolvedValue(newOrder)
      mockGetOrders.mockResolvedValue(makeOrderListResponse({ items: [newOrder], total: 1 }))

      const result = await store.createOrder({ customerName: '新客户' })

      expect(result).toEqual(newOrder)
      expect(mockCreateOrder).toHaveBeenCalledWith({ customerName: '新客户' })
      expect(mockGetOrders).toHaveBeenCalled()
    })

    it('sets error on failure', async () => {
      const store = useDispatchStore()
      mockCreateOrder.mockRejectedValue(new Error('创建失败'))

      await expect(store.createOrder({})).rejects.toThrow('创建失败')
      expect(store.error).toBe('创建失败')
    })
  })

  describe('updateOrder', () => {
    it('updates order and refreshes list', async () => {
      const store = useDispatchStore()
      const updated = makeOrder({ id: 'o1', customerName: '更新后' })
      mockUpdateOrder.mockResolvedValue(updated)
      mockGetOrders.mockResolvedValue(makeOrderListResponse({ items: [updated], total: 1 }))

      const result = await store.updateOrder('o1', { customerName: '更新后' })

      expect(result).toEqual(updated)
      expect(mockUpdateOrder).toHaveBeenCalledWith('o1', { customerName: '更新后' })
    })

    it('sets error on failure', async () => {
      const store = useDispatchStore()
      mockUpdateOrder.mockRejectedValue(new Error('编辑失败'))

      await expect(store.updateOrder('o1', {})).rejects.toThrow('编辑失败')
      expect(store.error).toBe('编辑失败')
    })
  })

  describe('deleteOrder', () => {
    it('deletes order and refreshes list', async () => {
      const store = useDispatchStore()
      mockDeleteOrder.mockResolvedValue(undefined)
      mockGetOrders.mockResolvedValue(makeOrderListResponse())

      await store.deleteOrder('o1')

      expect(mockDeleteOrder).toHaveBeenCalledWith('o1')
      expect(mockGetOrders).toHaveBeenCalled()
    })

    it('sets error on failure', async () => {
      const store = useDispatchStore()
      mockDeleteOrder.mockRejectedValue(new Error('删除失败'))

      await expect(store.deleteOrder('o1')).rejects.toThrow('删除失败')
      expect(store.error).toBe('删除失败')
    })
  })

  describe('assignOrder', () => {
    it('assigns order and updates local state', async () => {
      const store = useDispatchStore()
      const existing = makeOrder({ id: 'o1' })
      store.orders = [existing]
      const assigned = makeOrder({
        id: 'o1',
        status: OrderStatus.ASSIGNED,
        driverId: 'd1',
        driverName: '张三',
        vehicleId: 'v1',
        vehiclePlateNo: '粤A12345',
      })
      mockAssignOrder.mockResolvedValue(assigned)

      const result = await store.assignOrder('o1', { driverId: 'd1', vehicleId: 'v1' })

      expect(result).toEqual(assigned)
      expect(store.orders[0].status).toBe(OrderStatus.ASSIGNED)
      expect(store.orders[0].driverName).toBe('张三')
    })

    it('sets error on failure', async () => {
      const store = useDispatchStore()
      mockAssignOrder.mockRejectedValue(new Error('分配失败'))

      await expect(store.assignOrder('o1', { driverId: 'd1', vehicleId: 'v1' })).rejects.toThrow('分配失败')
      expect(store.error).toBe('分配失败')
    })
  })

  describe('completeOrder', () => {
    it('completes order and refreshes list', async () => {
      const store = useDispatchStore()
      const completed = makeOrder({ id: 'o1', status: OrderStatus.COMPLETED })
      mockCompleteOrder.mockResolvedValue(completed)
      mockGetOrders.mockResolvedValue(makeOrderListResponse({ items: [completed], total: 1 }))

      const result = await store.completeOrder('o1')

      expect(result).toEqual(completed)
      expect(mockCompleteOrder).toHaveBeenCalledWith('o1')
    })

    it('sets error on failure', async () => {
      const store = useDispatchStore()
      mockCompleteOrder.mockRejectedValue(new Error('标记完成失败'))

      await expect(store.completeOrder('o1')).rejects.toThrow('标记完成失败')
      expect(store.error).toBe('标记完成失败')
    })
  })

  describe('fetchAvailableResources', () => {
    it('loads available drivers and vehicles', async () => {
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

    it('sets error on failure', async () => {
      const store = useDispatchStore()
      mockGetAvailableResources.mockRejectedValue(new Error('获取失败'))

      await store.fetchAvailableResources()

      expect(store.error).toBe('获取失败')
    })
  })

  describe('fetchAddresses', () => {
    it('loads addresses', async () => {
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

    it('sets error on failure', async () => {
      const store = useDispatchStore()
      mockGetAddresses.mockRejectedValue(new Error('获取失败'))

      await store.fetchAddresses()

      expect(store.error).toBe('获取失败')
    })
  })

  describe('createAddress', () => {
    it('creates address and prepends to list', async () => {
      const store = useDispatchStore()
      store.addresses = [{ id: 'a1', name: '宁波港', createdAt: '2026-01-01T00:00:00Z' }]
      const newAddress = { id: 'a2', name: '上海港', createdAt: '2026-01-02T00:00:00Z' }
      mockCreateAddress.mockResolvedValue(newAddress)

      const result = await store.createAddress('上海港')

      expect(result).toEqual(newAddress)
      expect(store.addresses).toHaveLength(2)
      expect(store.addresses[0].name).toBe('上海港')
    })

    it('sets error on failure', async () => {
      const store = useDispatchStore()
      mockCreateAddress.mockRejectedValue(new Error('新增失败'))

      await expect(store.createAddress('上海港')).rejects.toThrow('新增失败')
      expect(store.error).toBe('新增失败')
    })
  })

  describe('deleteAddress', () => {
    it('deletes address and removes from list', async () => {
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

    it('sets error on failure', async () => {
      const store = useDispatchStore()
      mockDeleteAddress.mockRejectedValue(new Error('删除失败'))

      await expect(store.deleteAddress('a1')).rejects.toThrow('删除失败')
      expect(store.error).toBe('删除失败')
    })
  })

  describe('setTab', () => {
    it('changes activeTab and resets page to 1', async () => {
      const store = useDispatchStore()
      store.page = 3
      mockGetOrders.mockResolvedValue(makeOrderListResponse())

      store.setTab(OrderStatus.ASSIGNED)

      expect(store.activeTab).toBe(OrderStatus.ASSIGNED)
      expect(store.page).toBe(1)
    })
  })

  describe('setKeyword', () => {
    it('changes keyword and resets page to 1', async () => {
      const store = useDispatchStore()
      store.page = 5
      mockGetOrders.mockResolvedValue(makeOrderListResponse())

      store.setKeyword('测试')

      expect(store.keyword).toBe('测试')
      expect(store.page).toBe(1)
    })
  })

  describe('setPage', () => {
    it('changes page and fetches orders', async () => {
      const store = useDispatchStore()
      mockGetOrders.mockResolvedValue(makeOrderListResponse())

      store.setPage(3)

      expect(store.page).toBe(3)
      expect(mockGetOrders).toHaveBeenCalled()
    })
  })

  describe('setPageSize', () => {
    it('changes pageSize and resets page to 1', async () => {
      const store = useDispatchStore()
      store.page = 3
      mockGetOrders.mockResolvedValue(makeOrderListResponse())

      store.setPageSize(50)

      expect(store.pageSize).toBe(50)
      expect(store.page).toBe(1)
    })
  })
})