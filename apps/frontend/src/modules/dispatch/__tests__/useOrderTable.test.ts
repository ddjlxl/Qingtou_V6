import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OrderStatus, DocumentType } from '../types/order'
import type { Order } from '../types/order'
import {
  tabs,
  statusTagConfig,
  documentLabels,
  formatRoute,
  formatDateTime,
  canEdit,
  canAssign,
  canComplete,
  needsDeleteConfirm,
  getDeleteConfirmMessage,
  debouncedSearch,
} from '../components/useOrderTable'

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

describe('tabs', () => {
  it('has 6 tabs', () => {
    expect(tabs).toHaveLength(6)
  })

  it('first tab is all', () => {
    expect(tabs[0].value).toBe('all')
    expect(tabs[0].label).toBe('全部')
  })

  it('has pending tab', () => {
    expect(tabs[1].value).toBe(OrderStatus.PENDING)
  })

  it('has assigned tab', () => {
    expect(tabs[2].value).toBe(OrderStatus.ASSIGNED)
  })

  it('has transiting tab', () => {
    expect(tabs[3].value).toBe(OrderStatus.TRANSITING)
  })

  it('has completed tab', () => {
    expect(tabs[4].value).toBe(OrderStatus.COMPLETED)
  })

  it('has overdue tab', () => {
    expect(tabs[5].value).toBe(OrderStatus.OVERDUE)
  })
})

describe('statusTagConfig', () => {
  it('pending is info type', () => {
    expect(statusTagConfig[OrderStatus.PENDING]).toEqual({ type: 'info', label: '待分配' })
  })

  it('assigned is warning type', () => {
    expect(statusTagConfig[OrderStatus.ASSIGNED]).toEqual({ type: 'warning', label: '已分配' })
  })

  it('transiting has empty type', () => {
    expect(statusTagConfig[OrderStatus.TRANSITING]).toEqual({ type: '', label: '运输中' })
  })

  it('completed is success type', () => {
    expect(statusTagConfig[OrderStatus.COMPLETED]).toEqual({ type: 'success', label: '已完成' })
  })

  it('overdue is danger type', () => {
    expect(statusTagConfig[OrderStatus.OVERDUE]).toEqual({ type: 'danger', label: '已超时' })
  })
})

describe('documentLabels', () => {
  it('maps pickup_order', () => {
    expect(documentLabels[DocumentType.PICKUP_ORDER]).toBe('提箱单')
  })

  it('maps weighing', () => {
    expect(documentLabels[DocumentType.WEIGHING]).toBe('过磅')
  })

  it('maps rectification', () => {
    expect(documentLabels[DocumentType.RECTIFICATION]).toBe('整改')
  })
})

describe('formatRoute', () => {
  it('returns dash for empty route', () => {
    expect(formatRoute(makeOrder())).toBe('-')
  })

  it('returns origin only', () => {
    expect(formatRoute(makeOrder({ originName: '上海港' }))).toBe('上海港')
  })

  it('returns origin → dest', () => {
    expect(formatRoute(makeOrder({ originName: '上海港', destName: '昆山工厂' }))).toBe('上海港 → 昆山工厂')
  })

  it('returns origin → waypoint → dest', () => {
    expect(formatRoute(makeOrder({
      originName: '上海港',
      waypoints: ['苏州物流园'],
      destName: '昆山工厂',
    }))).toBe('上海港 → 苏州物流园 → 昆山工厂')
  })

  it('returns multiple waypoints', () => {
    expect(formatRoute(makeOrder({
      originName: '上海港',
      waypoints: ['苏州物流园', '无锡中转站'],
      destName: '昆山工厂',
    }))).toBe('上海港 → 苏州物流园 → 无锡中转站 → 昆山工厂')
  })
})

describe('formatDateTime', () => {
  it('formats ISO string with Z suffix to local time', () => {
    const result = formatDateTime('2026-05-16T00:53:20Z')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('converts UTC to local timezone correctly', () => {
    const result = formatDateTime('2026-05-16T00:53:20Z')
    const date = new Date('2026-05-16T00:53:20Z')
    const expectedYear = date.getFullYear()
    const expectedMonth = String(date.getMonth() + 1).padStart(2, '0')
    const expectedDay = String(date.getDate()).padStart(2, '0')
    const expectedHour = String(date.getHours()).padStart(2, '0')
    const expectedMin = String(date.getMinutes()).padStart(2, '0')
    const expectedSec = String(date.getSeconds()).padStart(2, '0')
    expect(result).toBe(`${expectedYear}-${expectedMonth}-${expectedDay} ${expectedHour}:${expectedMin}:${expectedSec}`)
  })

  it('treats ISO string without timezone as UTC and converts to local', () => {
    const result = formatDateTime('2026-05-16T00:53:20')
    const date = new Date('2026-05-16T00:53:20Z')
    const expectedYear = date.getFullYear()
    const expectedMonth = String(date.getMonth() + 1).padStart(2, '0')
    const expectedDay = String(date.getDate()).padStart(2, '0')
    const expectedHour = String(date.getHours()).padStart(2, '0')
    const expectedMin = String(date.getMinutes()).padStart(2, '0')
    const expectedSec = String(date.getSeconds()).padStart(2, '0')
    expect(result).toBe(`${expectedYear}-${expectedMonth}-${expectedDay} ${expectedHour}:${expectedMin}:${expectedSec}`)
  })

  it('formats ISO string with timezone offset', () => {
    const result = formatDateTime('2026-05-16T00:53:20+00:00')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('returns empty string for empty input', () => {
    expect(formatDateTime('')).toBe('')
  })

  it('returns empty string for invalid date', () => {
    expect(formatDateTime('invalid')).toBe('')
  })
})

describe('canEdit', () => {
  it('pending order can be edited', () => {
    expect(canEdit(makeOrder({ status: OrderStatus.PENDING }))).toBe(true)
  })

  it('assigned order cannot be edited', () => {
    expect(canEdit(makeOrder({ status: OrderStatus.ASSIGNED }))).toBe(false)
  })

  it('completed order cannot be edited', () => {
    expect(canEdit(makeOrder({ status: OrderStatus.COMPLETED }))).toBe(false)
  })
})

describe('canAssign', () => {
  it('pending order can be assigned', () => {
    expect(canAssign(makeOrder({ status: OrderStatus.PENDING }))).toBe(true)
  })

  it('assigned order cannot be assigned', () => {
    expect(canAssign(makeOrder({ status: OrderStatus.ASSIGNED }))).toBe(false)
  })
})

describe('canComplete', () => {
  it('assigned order can be completed', () => {
    expect(canComplete(makeOrder({ status: OrderStatus.ASSIGNED }))).toBe(true)
  })

  it('transiting order can be completed', () => {
    expect(canComplete(makeOrder({ status: OrderStatus.TRANSITING }))).toBe(true)
  })

  it('overdue order can be completed', () => {
    expect(canComplete(makeOrder({ status: OrderStatus.OVERDUE }))).toBe(true)
  })

  it('pending order cannot be completed', () => {
    expect(canComplete(makeOrder({ status: OrderStatus.PENDING }))).toBe(false)
  })

  it('completed order cannot be completed', () => {
    expect(canComplete(makeOrder({ status: OrderStatus.COMPLETED }))).toBe(false)
  })
})

describe('needsDeleteConfirm', () => {
  it('pending order does not need confirm', () => {
    expect(needsDeleteConfirm(makeOrder({ status: OrderStatus.PENDING }))).toBe(false)
  })

  it('assigned order needs confirm', () => {
    expect(needsDeleteConfirm(makeOrder({ status: OrderStatus.ASSIGNED }))).toBe(true)
  })

  it('completed order needs confirm', () => {
    expect(needsDeleteConfirm(makeOrder({ status: OrderStatus.COMPLETED }))).toBe(true)
  })
})

describe('getDeleteConfirmMessage', () => {
  it('returns executing message for assigned order', () => {
    const msg = getDeleteConfirmMessage(makeOrder({ status: OrderStatus.ASSIGNED }))
    expect(msg).toContain('正在执行中')
    expect(msg).toContain('自动释放')
  })

  it('returns executing message for transiting order', () => {
    const msg = getDeleteConfirmMessage(makeOrder({ status: OrderStatus.TRANSITING }))
    expect(msg).toContain('正在执行中')
  })

  it('returns generic message for other statuses', () => {
    const msg = getDeleteConfirmMessage(makeOrder({ status: OrderStatus.COMPLETED }))
    expect(msg).toBe('确定删除该任务吗？')
  })
})

describe('debouncedSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls callback after 300ms', () => {
    const callback = vi.fn()
    debouncedSearch(callback, 'test')

    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(callback).toHaveBeenCalledWith('test')
  })

  it('debounces multiple calls', () => {
    const callback = vi.fn()
    debouncedSearch(callback, 't')
    debouncedSearch(callback, 'te')
    debouncedSearch(callback, 'tes')
    debouncedSearch(callback, 'test')

    vi.advanceTimersByTime(300)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('test')
  })
})