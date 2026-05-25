import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDriverStore } from '../stores/useDriverStore'
import * as driverService from '../services/driverService'
import { OrderStatus, ContainerStatus } from '@/modules/dispatch'
import type { DriverOrderListResponse } from '../types'

vi.mock('../services/driverService')

const mockOrderListResponse: DriverOrderListResponse = {
  items: [
    {
      id: '1',
      orderNo: 'QT20260101001',
      status: OrderStatus.ASSIGNED,
      customerName: '测试客户',
      customerPhone: null,
      originName: '上海',
      destName: '昆山',
      waypoints: null,
      containerNo: 'ABCD1234',
      containerType: null,
      sealNo: null,
      businessType: null,
      containerStatus: ContainerStatus.HEAVY,
      documents: null,
      driverId: 'd1',
      driverName: '张司机',
      vehicleId: 'v1',
      vehiclePlateNo: '粤A88888',
      dispatcherId: 'dp1',
      dispatcherName: '调度员',
      remark: null,
      assignedAt: '2026-01-01T08:00:00',
      startedAt: null,
      completedAt: null,
      createdAt: '2026-01-01T07:00:00',
      updatedAt: '2026-01-01T07:00:00',
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
  statusCounts: {
    pending: 0,
    assigned: 1,
    transiting: 0,
    completed: 0,
    overdue: 0,
  },
}

describe('useDriverStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchOrders', () => {
    it('fetches orders and updates state', async () => {
      vi.spyOn(driverService.driverService, 'getOrders').mockResolvedValue(mockOrderListResponse)
      const store = useDriverStore()

      await store.fetchOrders()

      expect(store.orders).toHaveLength(1)
      expect(store.orders[0].orderNo).toBe('QT20260101001')
      expect(store.total).toBe(1)
      expect(store.statusCounts.assigned).toBe(1)
      expect(store.loading).toBe(false)
    })

    it('sets error on failure', async () => {
      vi.spyOn(driverService.driverService, 'getOrders').mockRejectedValue(new Error('网络错误'))
      const store = useDriverStore()

      await store.fetchOrders()

      expect(store.error).toBe('网络错误')
      expect(store.loading).toBe(false)
    })
  })

  describe('startOrder', () => {
    it('calls start API and refreshes orders', async () => {
      vi.spyOn(driverService.driverService, 'startOrder').mockResolvedValue({} as never)
      vi.spyOn(driverService.driverService, 'getOrders').mockResolvedValue(mockOrderListResponse)
      const store = useDriverStore()

      await store.startOrder('1')

      expect(driverService.driverService.startOrder).toHaveBeenCalledWith('1')
      expect(driverService.driverService.getOrders).toHaveBeenCalled()
    })

    it('throws and sets error on failure', async () => {
      vi.spyOn(driverService.driverService, 'startOrder').mockRejectedValue(new Error('开始运输失败'))
      const store = useDriverStore()

      await expect(store.startOrder('1')).rejects.toThrow()
      expect(store.error).toBe('开始运输失败')
    })
  })

  describe('completeOrder', () => {
    it('calls complete API and refreshes orders', async () => {
      vi.spyOn(driverService.driverService, 'completeOrder').mockResolvedValue({} as never)
      vi.spyOn(driverService.driverService, 'getOrders').mockResolvedValue(mockOrderListResponse)
      const store = useDriverStore()

      await store.completeOrder('1')

      expect(driverService.driverService.completeOrder).toHaveBeenCalledWith('1')
      expect(driverService.driverService.getOrders).toHaveBeenCalled()
    })

    it('throws and sets error on failure', async () => {
      vi.spyOn(driverService.driverService, 'completeOrder').mockRejectedValue(new Error('完成任务失败'))
      const store = useDriverStore()

      await expect(store.completeOrder('1')).rejects.toThrow()
      expect(store.error).toBe('完成任务失败')
    })
  })

  describe('setTab', () => {
    it('changes active tab and resets page', async () => {
      vi.spyOn(driverService.driverService, 'getOrders').mockResolvedValue(mockOrderListResponse)
      const store = useDriverStore()
      store.page = 3

      store.setTab(OrderStatus.TRANSITING)

      expect(store.activeTab).toBe(OrderStatus.TRANSITING)
      expect(store.page).toBe(1)
    })

    it('fetches orders with status filter', async () => {
      const spy = vi.spyOn(driverService.driverService, 'getOrders').mockResolvedValue(mockOrderListResponse)
      const store = useDriverStore()

      store.setTab(OrderStatus.TRANSITING)
      await vi.waitFor(() => expect(spy).toHaveBeenCalled())

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        status: OrderStatus.TRANSITING,
      }))
    })

    it('fetches orders without status filter when tab is all', async () => {
      const spy = vi.spyOn(driverService.driverService, 'getOrders').mockResolvedValue(mockOrderListResponse)
      const store = useDriverStore()

      store.setTab('all')
      await vi.waitFor(() => expect(spy).toHaveBeenCalled())

      expect(spy).toHaveBeenCalledWith(expect.not.objectContaining({
        status: expect.anything(),
      }))
    })
  })

  describe('setPage', () => {
    it('changes page and fetches orders', async () => {
      vi.spyOn(driverService.driverService, 'getOrders').mockResolvedValue(mockOrderListResponse)
      const store = useDriverStore()

      store.setPage(2)

      expect(store.page).toBe(2)
    })
  })

  describe('tabCounts', () => {
    it('computes tab counts from statusCounts', () => {
      const store = useDriverStore()
      store.total = 5
      store.statusCounts = {
        pending: 1,
        assigned: 2,
        transiting: 1,
        completed: 1,
        overdue: 0,
      }

      expect(store.tabCounts).toEqual({
        all: 5,
        pending: 1,
        assigned: 2,
        transiting: 1,
        completed: 1,
        overdue: 0,
      })
    })
  })

  describe('hasMore', () => {
    it('returns true when orders length < total', () => {
      const store = useDriverStore()
      store.orders = [...mockOrderListResponse.items] as never[]
      store.total = 45

      expect(store.hasMore).toBe(true)
    })

    it('returns false when orders length >= total', () => {
      const store = useDriverStore()
      store.orders = [...mockOrderListResponse.items] as never[]
      store.total = 1

      expect(store.hasMore).toBe(false)
    })
  })

  describe('loadMore', () => {
    const page2Response: DriverOrderListResponse = {
      items: [
        {
          id: '2',
          orderNo: 'QT20260101002',
          status: OrderStatus.TRANSITING,
          customerName: '客户B',
          customerPhone: null,
          originName: '北京',
          destName: '天津',
          waypoints: null,
          containerNo: 'EFGH5678',
          containerType: null,
          sealNo: null,
          businessType: null,
          containerStatus: ContainerStatus.EMPTY,
          documents: null,
          driverId: 'd1',
          driverName: '张司机',
          vehicleId: 'v1',
          vehiclePlateNo: '粤A88888',
          dispatcherId: 'dp1',
          dispatcherName: '调度员',
          remark: null,
          assignedAt: '2026-01-01T08:00:00',
          startedAt: '2026-01-01T09:00:00',
          completedAt: null,
          createdAt: '2026-01-01T07:00:00',
          updatedAt: '2026-01-01T09:00:00',
        },
      ],
      total: 45,
      page: 2,
      pageSize: 20,
      statusCounts: {
        pending: 0,
        assigned: 0,
        transiting: 1,
        completed: 0,
        overdue: 0,
      },
    }

    it('appends new data to existing orders', async () => {
      vi.spyOn(driverService.driverService, 'getOrders').mockResolvedValue(page2Response)
      const store = useDriverStore()
      store.orders = [...mockOrderListResponse.items] as never[]
      store.total = 45
      store.page = 1

      await store.loadMore()

      expect(store.page).toBe(2)
      expect(store.orders).toHaveLength(2)
      expect(store.orders[0].orderNo).toBe('QT20260101001')
      expect(store.orders[1].orderNo).toBe('QT20260101002')
      expect(store.loadingMore).toBe(false)
    })

    it('does not request when loadingMore is true', async () => {
      const spy = vi.spyOn(driverService.driverService, 'getOrders').mockResolvedValue(page2Response)
      const store = useDriverStore()
      store.orders = [...mockOrderListResponse.items] as never[]
      store.total = 45
      store.page = 1
      store.loadingMore = true

      await store.loadMore()

      expect(spy).not.toHaveBeenCalled()
    })

    it('does not request when hasMore is false', async () => {
      const spy = vi.spyOn(driverService.driverService, 'getOrders').mockResolvedValue(page2Response)
      const store = useDriverStore()
      store.orders = [...mockOrderListResponse.items] as never[]
      store.total = 1
      store.page = 1

      await store.loadMore()

      expect(spy).not.toHaveBeenCalled()
    })

    it('rolls back page and preserves orders on failure', async () => {
      vi.spyOn(driverService.driverService, 'getOrders').mockRejectedValue(new Error('加载失败'))
      const store = useDriverStore()
      store.orders = [...mockOrderListResponse.items] as never[]
      store.total = 45
      store.page = 1

      await store.loadMore()

      expect(store.page).toBe(1)
      expect(store.orders).toHaveLength(1)
      expect(store.error).toBe('加载失败')
      expect(store.loadingMore).toBe(false)
    })
  })

  describe('fetchOrders race condition', () => {
    it('discards stale response when tab switches quickly', async () => {
      let resolveFirst: (value: DriverOrderListResponse) => void
      let resolveSecond: (value: DriverOrderListResponse) => void
      const firstPromise = new Promise<DriverOrderListResponse>((resolve) => { resolveFirst = resolve })
      const secondPromise = new Promise<DriverOrderListResponse>((resolve) => { resolveSecond = resolve })

      const spy = vi.spyOn(driverService.driverService, 'getOrders')
      spy.mockReturnValueOnce(firstPromise)
      spy.mockReturnValueOnce(secondPromise)

      const store = useDriverStore()

      const firstCall = store.fetchOrders()
      const secondCall = store.fetchOrders()

      const firstResponse: DriverOrderListResponse = {
        items: [{ ...mockOrderListResponse.items[0], id: 'stale' }] as never[],
        total: 1,
        page: 1,
        pageSize: 20,
        statusCounts: mockOrderListResponse.statusCounts,
      }
      const secondResponse: DriverOrderListResponse = {
        items: [{ ...mockOrderListResponse.items[0], id: 'fresh' }] as never[],
        total: 1,
        page: 1,
        pageSize: 20,
        statusCounts: mockOrderListResponse.statusCounts,
      }

      resolveSecond!(secondResponse)
      resolveFirst!(firstResponse)

      await Promise.all([firstCall, secondCall])

      expect(store.orders[0].id).toBe('fresh')
      expect(store.loading).toBe(false)
    })
  })
})
