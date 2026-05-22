import { describe, it, expect } from 'vitest'
import {
  createInitialFormState,
  computeRouteSummary,
  fillFormFromOrder,
  resetForm,
  addWaypoint,
  removeWaypoint,
  onContainerNoInput,
  onSealNoInput,
  buildRequest,
} from '../composables/useOrderFormHelpers'
import { BusinessType, ContainerType, DocumentType, OrderStatus } from '../types/order'
import type { Order } from '../types/order'

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

describe('createInitialFormState', () => {
  it('returns form with all empty fields', () => {
    const form = createInitialFormState()

    expect(form.customerName).toBe('')
    expect(form.customerPhone).toBe('')
    expect(form.originName).toBe('')
    expect(form.destName).toBe('')
    expect(form.waypoints).toEqual([])
    expect(form.containerNo).toBe('')
    expect(form.containerType).toBe('')
    expect(form.sealNo).toBe('')
    expect(form.businessType).toBe('')
    expect(form.documents).toEqual([])
    expect(form.driverId).toBe('')
    expect(form.vehicleId).toBe('')
    expect(form.remark).toBe('')
  })
})

describe('computeRouteSummary', () => {
  it('returns empty string when no route fields filled', () => {
    const form = createInitialFormState()
    expect(computeRouteSummary(form)).toBe('')
  })

  it('returns origin only', () => {
    const form = createInitialFormState()
    form.originName = '上海港'
    expect(computeRouteSummary(form)).toBe('上海港')
  })

  it('returns origin → dest', () => {
    const form = createInitialFormState()
    form.originName = '上海港'
    form.destName = '昆山工厂'
    expect(computeRouteSummary(form)).toBe('上海港 → 昆山工厂')
  })

  it('returns origin → waypoint → dest', () => {
    const form = createInitialFormState()
    form.originName = '上海港'
    form.waypoints = ['苏州物流园']
    form.destName = '昆山工厂'
    expect(computeRouteSummary(form)).toBe('上海港 → 苏州物流园 → 昆山工厂')
  })

  it('filters out empty waypoints', () => {
    const form = createInitialFormState()
    form.originName = '上海港'
    form.waypoints = ['', '苏州物流园', '']
    form.destName = '昆山工厂'
    expect(computeRouteSummary(form)).toBe('上海港 → 苏州物流园 → 昆山工厂')
  })

  it('returns only waypoints and dest when no origin', () => {
    const form = createInitialFormState()
    form.waypoints = ['苏州物流园']
    form.destName = '昆山工厂'
    expect(computeRouteSummary(form)).toBe('苏州物流园 → 昆山工厂')
  })
})

describe('fillFormFromOrder', () => {
  it('fills all fields from order', () => {
    const form = createInitialFormState()
    const order = makeOrder({
      customerName: '测试客户',
      customerPhone: '13800138000',
      originName: '上海港',
      destName: '昆山工厂',
      waypoints: ['苏州物流园'],
      containerNo: 'ABCD1234567',
      containerType: ContainerType.GP40,
      sealNo: 'SEAL001',
      businessType: BusinessType.HEAVY_TRANSPORT,
      documents: [DocumentType.PICKUP_ORDER],
      remark: '测试备注',
    })

    fillFormFromOrder(form, order)

    expect(form.customerName).toBe('测试客户')
    expect(form.customerPhone).toBe('13800138000')
    expect(form.originName).toBe('上海港')
    expect(form.destName).toBe('昆山工厂')
    expect(form.waypoints).toEqual(['苏州物流园'])
    expect(form.containerNo).toBe('ABCD1234567')
    expect(form.containerType).toBe(ContainerType.GP40)
    expect(form.sealNo).toBe('SEAL001')
    expect(form.businessType).toBe(BusinessType.HEAVY_TRANSPORT)
    expect(form.documents).toEqual([DocumentType.PICKUP_ORDER])
    expect(form.remark).toBe('测试备注')
  })

  it('handles null fields as empty strings', () => {
    const form = createInitialFormState()
    const order = makeOrder()

    fillFormFromOrder(form, order)

    expect(form.customerName).toBe('')
    expect(form.originName).toBe('')
    expect(form.containerNo).toBe('')
  })

  it('resets driverId and vehicleId', () => {
    const form = createInitialFormState()
    form.driverId = 'd1'
    form.vehicleId = 'v1'
    const order = makeOrder({ driverId: 'd2', vehicleId: 'v2' })

    fillFormFromOrder(form, order)

    expect(form.driverId).toBe('')
    expect(form.vehicleId).toBe('')
  })
})

describe('resetForm', () => {
  it('resets all fields to initial values', () => {
    const form = createInitialFormState()
    form.customerName = '测试'
    form.originName = '上海港'
    form.waypoints = ['苏州']
    form.containerNo = 'ABCD1234567'

    resetForm(form)

    expect(form.customerName).toBe('')
    expect(form.originName).toBe('')
    expect(form.waypoints).toEqual([])
    expect(form.containerNo).toBe('')
  })
})

describe('addWaypoint', () => {
  it('adds empty waypoint to list', () => {
    const form = createInitialFormState()
    addWaypoint(form)
    expect(form.waypoints).toEqual([''])
  })

  it('appends to existing waypoints', () => {
    const form = createInitialFormState()
    form.waypoints = ['苏州物流园']
    addWaypoint(form)
    expect(form.waypoints).toEqual(['苏州物流园', ''])
  })
})

describe('removeWaypoint', () => {
  it('removes waypoint at index', () => {
    const form = createInitialFormState()
    form.waypoints = ['苏州物流园', '无锡中转站', '常州仓库']
    removeWaypoint(form, 1)
    expect(form.waypoints).toEqual(['苏州物流园', '常州仓库'])
  })
})

describe('onContainerNoInput', () => {
  it('converts to uppercase', () => {
    const form = createInitialFormState()
    onContainerNoInput(form, 'abcd1234567')
    expect(form.containerNo).toBe('ABCD1234567')
  })
})

describe('onSealNoInput', () => {
  it('converts to uppercase', () => {
    const form = createInitialFormState()
    onSealNoInput(form, 'seal001')
    expect(form.sealNo).toBe('SEAL001')
  })
})

describe('buildRequest', () => {
  it('builds request with all fields', () => {
    const form = createInitialFormState()
    form.customerName = '测试客户'
    form.originName = '上海港'
    form.destName = '昆山工厂'
    form.waypoints = ['苏州物流园']
    form.containerNo = 'ABCD1234567'
    form.containerType = ContainerType.GP40
    form.businessType = BusinessType.HEAVY_TRANSPORT
    form.documents = [DocumentType.PICKUP_ORDER]

    const request = buildRequest(form)

    expect(request.customerName).toBe('测试客户')
    expect(request.originName).toBe('上海港')
    expect(request.destName).toBe('昆山工厂')
    expect(request.waypoints).toEqual(['苏州物流园'])
    expect(request.containerNo).toBe('ABCD1234567')
    expect(request.containerType).toBe(ContainerType.GP40)
    expect(request.businessType).toBe(BusinessType.HEAVY_TRANSPORT)
    expect(request.documents).toEqual([DocumentType.PICKUP_ORDER])
  })

  it('converts empty strings to undefined', () => {
    const form = createInitialFormState()

    const request = buildRequest(form)

    expect(request.customerName).toBeUndefined()
    expect(request.originName).toBeUndefined()
    expect(request.containerNo).toBeUndefined()
  })

  it('filters empty waypoints', () => {
    const form = createInitialFormState()
    form.waypoints = ['', '苏州物流园', '']

    const request = buildRequest(form)

    expect(request.waypoints).toEqual(['苏州物流园'])
  })

  it('returns undefined for empty waypoints array', () => {
    const form = createInitialFormState()
    form.waypoints = ['', '']

    const request = buildRequest(form)

    expect(request.waypoints).toBeUndefined()
  })

  it('returns undefined for empty documents array', () => {
    const form = createInitialFormState()

    const request = buildRequest(form)

    expect(request.documents).toBeUndefined()
  })
})