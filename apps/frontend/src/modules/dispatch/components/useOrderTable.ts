import { OrderStatus, DocumentType } from '../types/order'
import type { Order } from '../types/order'
import { formatDate } from '@/shared/utils/format'

export const tabs = [
  { value: 'all' as const, label: '全部' },
  { value: OrderStatus.PENDING, label: '待分配' },
  { value: OrderStatus.ASSIGNED, label: '已分配' },
  { value: OrderStatus.TRANSITING, label: '运输中' },
  { value: OrderStatus.COMPLETED, label: '已完成' },
  { value: OrderStatus.OVERDUE, label: '已超时' },
]

export const statusTagConfig: Record<string, { type: string; label: string }> = {
  [OrderStatus.PENDING]: { type: 'info', label: '待分配' },
  [OrderStatus.ASSIGNED]: { type: 'warning', label: '已分配' },
  [OrderStatus.TRANSITING]: { type: '', label: '运输中' },
  [OrderStatus.COMPLETED]: { type: 'success', label: '已完成' },
  [OrderStatus.OVERDUE]: { type: 'danger', label: '已超时' },
}

export const documentLabels: Record<string, string> = {
  [DocumentType.PICKUP_ORDER]: '提箱单',
  [DocumentType.WEIGHING]: '过磅',
  [DocumentType.RECTIFICATION]: '整改',
}

export function formatRoute(order: Order): string {
  const parts: string[] = []
  if (order.originName) parts.push(order.originName)
  if (order.waypoints && order.waypoints.length > 0) {
    parts.push(...order.waypoints)
  }
  if (order.destName) parts.push(order.destName)
  return parts.length > 0 ? parts.join(' → ') : '-'
}

export function formatDateTime(value: string): string {
  if (!value) return ''
  const iso = /Z|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`
  return formatDate(iso)
}

export function canEdit(order: Order): boolean {
  return order.status !== OrderStatus.COMPLETED
}

export function canAssign(order: Order): boolean {
  return order.status === OrderStatus.PENDING
}

export function canComplete(order: Order): boolean {
  return [OrderStatus.ASSIGNED, OrderStatus.TRANSITING, OrderStatus.OVERDUE].includes(order.status)
}

export function needsDeleteConfirm(order: Order): boolean {
  return order.status !== OrderStatus.PENDING
}

export function getDeleteConfirmMessage(order: Order): string {
  if (order.status === OrderStatus.ASSIGNED || order.status === OrderStatus.TRANSITING) {
    return '该任务正在执行中，确定删除吗？车辆和司机将自动释放'
  }
  return '确定删除该任务吗？'
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function debouncedSearch(callback: (val: string) => void, val: string) {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    callback(val)
  }, 300)
}