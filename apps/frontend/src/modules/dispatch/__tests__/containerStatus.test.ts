/** Task-03 测试：containerStatus 前端透传
 * 覆盖 AC：AC-022
 */
import { describe, it, expect } from 'vitest'
import {
  createInitialFormState,
  fillFormFromOrder,
  resetForm,
  buildRequest,
} from '../composables/useOrderFormHelpers'
import { containerStatusOptions } from '../composables/useOrderFormOptions'
import { ContainerStatus, OrderStatus } from '../types/order'
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

describe('ContainerStatus enum', () => {
  it('has HEAVY value', () => {
    expect(ContainerStatus.HEAVY).toBe('heavy')
  })

  it('has EMPTY value', () => {
    expect(ContainerStatus.EMPTY).toBe('empty')
  })
})

describe('containerStatusOptions', () => {
  it('has 2 options', () => {
    expect(containerStatusOptions).toHaveLength(2)
  })

  it('includes heavy option', () => {
    expect(containerStatusOptions).toContainEqual({ value: ContainerStatus.HEAVY, label: '重箱' })
  })

  it('includes empty option', () => {
    expect(containerStatusOptions).toContainEqual({ value: ContainerStatus.EMPTY, label: '空箱' })
  })
})

describe('createInitialFormState - containerStatus', () => {
  it('initializes containerStatus as empty string', () => {
    const form = createInitialFormState()
    expect(form.containerStatus).toBe('')
  })
})

describe('fillFormFromOrder - containerStatus', () => {
  it('fills containerStatus from order', () => {
    const form = createInitialFormState()
    const order = makeOrder({ containerStatus: ContainerStatus.HEAVY })

    fillFormFromOrder(form, order)

    expect(form.containerStatus).toBe(ContainerStatus.HEAVY)
  })

  it('handles null containerStatus as empty string', () => {
    const form = createInitialFormState()
    const order = makeOrder({ containerStatus: null })

    fillFormFromOrder(form, order)

    expect(form.containerStatus).toBe('')
  })
})

describe('resetForm - containerStatus', () => {
  it('resets containerStatus to empty string', () => {
    const form = createInitialFormState()
    form.containerStatus = ContainerStatus.HEAVY

    resetForm(form)

    expect(form.containerStatus).toBe('')
  })
})

describe('buildRequest - containerStatus', () => {
  it('includes containerStatus in request', () => {
    const form = createInitialFormState()
    form.containerStatus = ContainerStatus.HEAVY

    const request = buildRequest(form)

    expect(request.containerStatus).toBe(ContainerStatus.HEAVY)
  })

  it('converts empty containerStatus to undefined', () => {
    const form = createInitialFormState()

    const request = buildRequest(form)

    expect(request.containerStatus).toBeUndefined()
  })
})
