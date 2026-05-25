import { describe, it, expect, beforeEach, vi } from 'vitest'
import { driverService } from '../services/driverService'
import http from '@/shared/api/client'
import { OrderStatus } from '@/modules/dispatch'
import { BusinessType, ContainerType, ContainerStatus } from '@/modules/dispatch/types/order'

vi.mock('@/shared/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockHttp = vi.mocked(http)

function makeOrder(overrides = {}) {
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
    containerType: ContainerType.GP40,
    sealNo: 'SEAL001',
    businessType: BusinessType.HEAVY_TRANSPORT,
    containerStatus: ContainerStatus.HEAVY,
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

describe('driverService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrders', () => {
    it('调用 GET /v1/driver/orders', async () => {
      const mockResponse = {
        items: [makeOrder()],
        total: 1,
        page: 1,
        pageSize: 10,
        statusCounts: {
          pending: 0,
          assigned: 1,
          transiting: 0,
          completed: 0,
          overdue: 0,
        },
      }
      mockHttp.get.mockResolvedValue(mockResponse)

      const result = await driverService.getOrders()

      expect(mockHttp.get).toHaveBeenCalledWith('/v1/driver/orders', { params: undefined })
      expect(result).toEqual(mockResponse)
    })

    it('支持分页参数', async () => {
      const mockResponse = {
        items: [],
        total: 100,
        page: 2,
        pageSize: 20,
        statusCounts: {
          pending: 10,
          assigned: 20,
          transiting: 30,
          completed: 40,
          overdue: 0,
        },
      }
      mockHttp.get.mockResolvedValue(mockResponse)

      const result = await driverService.getOrders({ page: 2, pageSize: 20 })

      expect(mockHttp.get).toHaveBeenCalledWith('/v1/driver/orders', {
        params: { page: 2, pageSize: 20 },
      })
      expect(result.page).toBe(2)
      expect(result.pageSize).toBe(20)
    })

    it('支持状态筛选参数', async () => {
      const mockResponse = {
        items: [makeOrder({ status: OrderStatus.TRANSITING })],
        total: 1,
        page: 1,
        pageSize: 10,
        statusCounts: {
          pending: 0,
          assigned: 0,
          transiting: 1,
          completed: 0,
          overdue: 0,
        },
      }
      mockHttp.get.mockResolvedValue(mockResponse)

      const result = await driverService.getOrders({ status: OrderStatus.TRANSITING })

      expect(mockHttp.get).toHaveBeenCalledWith('/v1/driver/orders', {
        params: { status: OrderStatus.TRANSITING },
      })
      expect(result.items[0].status).toBe(OrderStatus.TRANSITING)
    })

    it('同时支持分页和状态筛选', async () => {
      const mockResponse = {
        items: [],
        total: 50,
        page: 1,
        pageSize: 10,
        statusCounts: {
          pending: 0,
          assigned: 0,
          transiting: 50,
          completed: 0,
          overdue: 0,
        },
      }
      mockHttp.get.mockResolvedValue(mockResponse)

      await driverService.getOrders({
        status: OrderStatus.TRANSITING,
        page: 1,
        pageSize: 10,
      })

      expect(mockHttp.get).toHaveBeenCalledWith('/v1/driver/orders', {
        params: {
          status: OrderStatus.TRANSITING,
          page: 1,
          pageSize: 10,
        },
      })
    })
  })

  describe('startOrder', () => {
    it('调用 POST /v1/driver/orders/{id}/start', async () => {
      const mockOrder = makeOrder({
        status: OrderStatus.TRANSITING,
        startedAt: '2026-05-25T12:00:00Z',
      })
      mockHttp.post.mockResolvedValue(mockOrder)

      const result = await driverService.startOrder('order-1')

      expect(mockHttp.post).toHaveBeenCalledWith('/v1/driver/orders/order-1/start')
      expect(result.status).toBe(OrderStatus.TRANSITING)
      expect(result.startedAt).toBe('2026-05-25T12:00:00Z')
    })

    it('返回更新后的订单', async () => {
      const mockOrder = makeOrder({
        id: 'order-2',
        status: OrderStatus.TRANSITING,
      })
      mockHttp.post.mockResolvedValue(mockOrder)

      const result = await driverService.startOrder('order-2')

      expect(result.id).toBe('order-2')
    })
  })

  describe('completeOrder', () => {
    it('调用 POST /v1/driver/orders/{id}/complete', async () => {
      const mockOrder = makeOrder({
        status: OrderStatus.COMPLETED,
        completedAt: '2026-05-25T18:00:00Z',
      })
      mockHttp.post.mockResolvedValue(mockOrder)

      const result = await driverService.completeOrder('order-1')

      expect(mockHttp.post).toHaveBeenCalledWith('/v1/driver/orders/order-1/complete')
      expect(result.status).toBe(OrderStatus.COMPLETED)
      expect(result.completedAt).toBe('2026-05-25T18:00:00Z')
    })

    it('返回更新后的订单', async () => {
      const mockOrder = makeOrder({
        id: 'order-3',
        status: OrderStatus.COMPLETED,
      })
      mockHttp.post.mockResolvedValue(mockOrder)

      const result = await driverService.completeOrder('order-3')

      expect(result.id).toBe('order-3')
    })
  })
})
