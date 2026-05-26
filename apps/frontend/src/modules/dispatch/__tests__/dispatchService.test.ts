import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  Order,
  OrderListResponse,
  AvailableResources,
  DispatchAddress,
  RouteTemplate,
} from '../types/order'
import { OrderStatus, ContainerType, BusinessType, ContainerStatus, DocumentType } from '../types/order'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/shared/api/client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}))

import { dispatchService } from '../services/dispatchService'

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

describe('dispatchService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrders', () => {
    it('无参数时调用 GET /v1/dispatch/orders', async () => {
      const response = makeOrderListResponse()
      mockGet.mockResolvedValue(response)

      const result = await dispatchService.getOrders()

      expect(mockGet).toHaveBeenCalledWith('/v1/dispatch/orders', { params: undefined })
      expect(result.items).toEqual([])
      expect(result.total).toBe(0)
    })

    it('带参数时正确传递查询参数', async () => {
      const orders = [makeOrder()]
      const response = makeOrderListResponse({ items: orders, total: 1 })
      mockGet.mockResolvedValue(response)

      const params = { page: 2, pageSize: 10, status: OrderStatus.PENDING, keyword: '测试' }
      const result = await dispatchService.getOrders(params)

      expect(mockGet).toHaveBeenCalledWith('/v1/dispatch/orders', { params })
      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(1)
    })
  })

  describe('getOrder', () => {
    it('调用 GET /v1/dispatch/orders/:id', async () => {
      const order = makeOrder()
      mockGet.mockResolvedValue(order)

      const result = await dispatchService.getOrder('o1')

      expect(mockGet).toHaveBeenCalledWith('/v1/dispatch/orders/o1')
      expect(result.id).toBe('o1')
      expect(result.orderNo).toBe('T202605150001')
    })
  })

  describe('createOrder', () => {
    it('调用 POST /v1/dispatch/orders 并返回新订单', async () => {
      const newOrder = makeOrder({ id: 'o2', customerName: '新客户' })
      mockPost.mockResolvedValue(newOrder)

      const data = { customerName: '新客户', originName: '上海港', destName: '昆山工厂' }
      const result = await dispatchService.createOrder(data)

      expect(mockPost).toHaveBeenCalledWith('/v1/dispatch/orders', data)
      expect(result.id).toBe('o2')
      expect(result.customerName).toBe('新客户')
    })
  })

  describe('updateOrder', () => {
    it('调用 PUT /v1/dispatch/orders/:id 并返回更新后的订单', async () => {
      const updated = makeOrder({ id: 'o1', customerName: '更新客户' })
      mockPut.mockResolvedValue(updated)

      const data = { customerName: '更新客户' }
      const result = await dispatchService.updateOrder('o1', data)

      expect(mockPut).toHaveBeenCalledWith('/v1/dispatch/orders/o1', data)
      expect(result.customerName).toBe('更新客户')
    })
  })

  describe('deleteOrder', () => {
    it('调用 DELETE /v1/dispatch/orders/:id', async () => {
      mockDelete.mockResolvedValue(undefined)

      const result = await dispatchService.deleteOrder('o1')

      expect(mockDelete).toHaveBeenCalledWith('/v1/dispatch/orders/o1')
      expect(result).toBeUndefined()
    })
  })

  describe('assignOrder', () => {
    it('调用 POST /v1/dispatch/orders/:id/assign 并返回已分配订单', async () => {
      const assigned = makeOrder({ id: 'o1', status: OrderStatus.ASSIGNED, driverId: 'd1', vehicleId: 'v1' })
      mockPost.mockResolvedValue(assigned)

      const data = { driverId: 'd1', vehicleId: 'v1' }
      const result = await dispatchService.assignOrder('o1', data)

      expect(mockPost).toHaveBeenCalledWith('/v1/dispatch/orders/o1/assign', data)
      expect(result.status).toBe(OrderStatus.ASSIGNED)
    })
  })

  describe('completeOrder', () => {
    it('调用 POST /v1/dispatch/orders/:id/complete 并返回已完成订单', async () => {
      const completed = makeOrder({ id: 'o1', status: OrderStatus.COMPLETED })
      mockPost.mockResolvedValue(completed)

      const result = await dispatchService.completeOrder('o1')

      expect(mockPost).toHaveBeenCalledWith('/v1/dispatch/orders/o1/complete')
      expect(result.status).toBe(OrderStatus.COMPLETED)
    })
  })

  describe('getAvailableResources', () => {
    it('调用 GET /v1/dispatch/orders/available-resources 并返回资源列表', async () => {
      const resources: AvailableResources = {
        drivers: [{ id: 'd1', name: '张三', phone: '13800138000', boundVehiclePlateNo: null }],
        vehicles: [{ id: 'v1', plateNo: '粤A12345', boundDriverName: null }],
      }
      mockGet.mockResolvedValue(resources)

      const result = await dispatchService.getAvailableResources()

      expect(mockGet).toHaveBeenCalledWith('/v1/dispatch/orders/available-resources')
      expect(result.drivers).toHaveLength(1)
      expect(result.vehicles).toHaveLength(1)
    })

    it('无资源时返回空数组', async () => {
      const resources: AvailableResources = { drivers: [], vehicles: [] }
      mockGet.mockResolvedValue(resources)

      const result = await dispatchService.getAvailableResources()

      expect(result.drivers).toEqual([])
      expect(result.vehicles).toEqual([])
    })
  })

  describe('getRouteTemplate', () => {
    it('调用 GET /v1/dispatch/route-templates/:businessType', async () => {
      const template: RouteTemplate = {
        originName: '上海港',
        waypoints: ['苏州物流园'],
        destName: '昆山工厂',
        documents: null,
        containerStatus: null,
      }
      mockGet.mockResolvedValue(template)

      const result = await dispatchService.getRouteTemplate(BusinessType.HEAVY_TRANSPORT)

      expect(mockGet).toHaveBeenCalledWith('/v1/dispatch/route-templates/heavy_transport')
      expect(result.originName).toBe('上海港')
      expect(result.waypoints).toEqual(['苏州物流园'])
    })
  })

  describe('listRouteTemplates', () => {
    it('调用 GET /v1/dispatch/route-templates 并返回模板列表', async () => {
      const templates: RouteTemplate[] = [
        { businessType: BusinessType.HEAVY_TRANSPORT, originName: '上海港', waypoints: null, destName: '昆山工厂', documents: null, containerStatus: null },
      ]
      mockGet.mockResolvedValue({ items: templates })

      const result = await dispatchService.listRouteTemplates()

      expect(mockGet).toHaveBeenCalledWith('/v1/dispatch/route-templates')
      expect(result.items).toHaveLength(1)
    })

    it('无模板时返回空列表', async () => {
      mockGet.mockResolvedValue({ items: [] })

      const result = await dispatchService.listRouteTemplates()

      expect(result.items).toEqual([])
    })
  })

  describe('updateRouteTemplate', () => {
    it('调用 PUT /v1/dispatch/route-templates/:businessType 并返回更新后的模板', async () => {
      const template: RouteTemplate = {
        originName: '宁波港',
        waypoints: null,
        destName: '杭州仓库',
        documents: null,
        containerStatus: null,
      }
      mockPut.mockResolvedValue(template)

      const data = {
        originName: '宁波港',
        waypoints: null,
        destName: '杭州仓库',
        documents: null,
        containerStatus: null,
      }
      const result = await dispatchService.updateRouteTemplate(BusinessType.EMPTY_TRANSPORT, data)

      expect(mockPut).toHaveBeenCalledWith('/v1/dispatch/route-templates/empty_transport', data)
      expect(result.originName).toBe('宁波港')
    })
  })

  describe('getAddresses', () => {
    it('调用 GET /v1/dispatch/addresses 并返回地址列表', async () => {
      const addresses: DispatchAddress[] = [
        { id: 'a1', name: '上海港', createdAt: '2026-01-01T00:00:00Z' },
        { id: 'a2', name: '宁波港', createdAt: '2026-01-02T00:00:00Z' },
      ]
      mockGet.mockResolvedValue({ items: addresses })

      const result = await dispatchService.getAddresses()

      expect(mockGet).toHaveBeenCalledWith('/v1/dispatch/addresses')
      expect(result.items).toHaveLength(2)
      expect(result.items[0].name).toBe('上海港')
    })

    it('无地址时返回空列表', async () => {
      mockGet.mockResolvedValue({ items: [] })

      const result = await dispatchService.getAddresses()

      expect(result.items).toEqual([])
    })
  })

  describe('createAddress', () => {
    it('调用 POST /v1/dispatch/addresses 并返回新地址', async () => {
      const newAddress: DispatchAddress = { id: 'a3', name: '广州港', createdAt: '2026-01-03T00:00:00Z' }
      mockPost.mockResolvedValue(newAddress)

      const result = await dispatchService.createAddress('广州港')

      expect(mockPost).toHaveBeenCalledWith('/v1/dispatch/addresses', { name: '广州港' })
      expect(result.name).toBe('广州港')
    })
  })

  describe('deleteAddress', () => {
    it('调用 DELETE /v1/dispatch/addresses/:id', async () => {
      mockDelete.mockResolvedValue(undefined)

      const result = await dispatchService.deleteAddress('a1')

      expect(mockDelete).toHaveBeenCalledWith('/v1/dispatch/addresses/a1')
      expect(result).toBeUndefined()
    })
  })
})
