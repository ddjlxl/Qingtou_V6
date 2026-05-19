import type { Order, OrderStatus, OrderStatusCounts } from '@/modules/dispatch/types/order'

export type DriverOrder = Order

export interface DriverOrderListResponse {
  items: DriverOrder[]
  total: number
  page: number
  pageSize: number
  statusCounts: OrderStatusCounts
}

export interface DriverOrderListParams {
  status?: OrderStatus
  page?: number
  pageSize?: number
}
