import http from '@/shared/api/client'
import type {
  Order,
  OrderListResponse,
  OrderListParams,
  CreateOrderRequest,
  UpdateOrderRequest,
  AssignOrderRequest,
  AvailableResources,
  DispatchAddress,
  RouteTemplate,
} from '../types/order'

export const dispatchService = {
  getOrders(params?: OrderListParams) {
    return http.get<OrderListResponse>('/v1/dispatch/orders', { params })
  },

  getOrder(id: string) {
    return http.get<Order>(`/v1/dispatch/orders/${id}`)
  },

  createOrder(data: CreateOrderRequest) {
    return http.post<Order>('/v1/dispatch/orders', data)
  },

  updateOrder(id: string, data: UpdateOrderRequest) {
    return http.put<Order>(`/v1/dispatch/orders/${id}`, data)
  },

  deleteOrder(id: string) {
    return http.delete<void>(`/v1/dispatch/orders/${id}`)
  },

  assignOrder(id: string, data: AssignOrderRequest) {
    return http.post<Order>(`/v1/dispatch/orders/${id}/assign`, data)
  },

  completeOrder(id: string) {
    return http.post<Order>(`/v1/dispatch/orders/${id}/complete`)
  },

  getAvailableResources() {
    return http.get<AvailableResources>('/v1/dispatch/orders/available-resources')
  },

  getRouteTemplate(businessType: string) {
    return http.get<RouteTemplate>(`/v1/dispatch/route-templates/${businessType}`)
  },

  listRouteTemplates() {
    return http.get<{ items: RouteTemplate[] }>('/v1/dispatch/route-templates')
  },

  updateRouteTemplate(businessType: string, data: { originName: string; waypoints: string[] | null; destName: string }) {
    return http.put<RouteTemplate>(`/v1/dispatch/route-templates/${businessType}`, data)
  },

  getAddresses() {
    return http.get<{ items: DispatchAddress[] }>('/v1/dispatch/addresses')
  },

  createAddress(name: string) {
    return http.post<DispatchAddress>('/v1/dispatch/addresses', { name })
  },

  deleteAddress(id: string) {
    return http.delete<void>(`/v1/dispatch/addresses/${id}`)
  },
}