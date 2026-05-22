import http from '@/shared/api/client'
import type { DriverOrderListResponse, DriverOrderListParams } from '../types'
import type { Order } from '@/modules/dispatch'

export const driverService = {
  getOrders(params?: DriverOrderListParams) {
    return http.get<DriverOrderListResponse>('/v1/driver/orders', { params })
  },

  startOrder(orderId: string) {
    return http.post<Order>(`/v1/driver/orders/${orderId}/start`)
  },

  completeOrder(orderId: string) {
    return http.post<Order>(`/v1/driver/orders/${orderId}/complete`)
  },
}
