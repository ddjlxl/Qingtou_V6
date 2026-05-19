import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDriverStore } from '../stores/useDriverStore'
import * as driverService from '../services/driverService'
import { OrderStatus, ContainerStatus } from '@/modules/dispatch/types/order'
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
})
