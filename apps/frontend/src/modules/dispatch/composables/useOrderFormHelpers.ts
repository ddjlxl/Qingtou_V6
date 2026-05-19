import { reactive } from 'vue'
import type { OrderFormState } from './useOrderForm'
import type { Order, CreateOrderRequest, UpdateOrderRequest } from '../types/order'
import { BusinessType, ContainerType, ContainerStatus } from '../types/order'

export function createInitialFormState(): OrderFormState {
  return reactive<OrderFormState>({
    customerName: '',
    customerPhone: '',
    originName: '',
    destName: '',
    waypoints: [],
    containerNo: '',
    containerType: '',
    sealNo: '',
    businessType: '',
    containerStatus: '',
    documents: [],
    driverId: '',
    vehicleId: '',
    remark: '',
  })
}

export function computeRouteSummary(form: OrderFormState): string {
  const parts: string[] = []
  if (form.originName) parts.push(form.originName)
  const validWaypoints = form.waypoints.filter((w) => w.trim())
  if (validWaypoints.length > 0) parts.push(...validWaypoints)
  if (form.destName) parts.push(form.destName)
  return parts.length > 0 ? parts.join(' → ') : ''
}

export function fillFormFromOrder(form: OrderFormState, order: Order) {
  form.customerName = order.customerName || ''
  form.customerPhone = order.customerPhone || ''
  form.originName = order.originName || ''
  form.destName = order.destName || ''
  form.waypoints = order.waypoints || []
  form.containerNo = order.containerNo || ''
  form.containerType = (order.containerType as ContainerType) || ''
  form.sealNo = order.sealNo || ''
  form.businessType = (order.businessType as BusinessType) || ''
  form.containerStatus = (order.containerStatus as ContainerStatus) || ''
  form.documents = order.documents || []
  form.remark = order.remark || ''
  form.driverId = ''
  form.vehicleId = ''
}

export function resetForm(form: OrderFormState) {
  form.customerName = ''
  form.customerPhone = ''
  form.originName = ''
  form.destName = ''
  form.waypoints = []
  form.containerNo = ''
  form.containerType = ''
  form.sealNo = ''
  form.businessType = ''
  form.containerStatus = ''
  form.documents = []
  form.driverId = ''
  form.vehicleId = ''
  form.remark = ''
}

export function addWaypoint(form: OrderFormState) {
  form.waypoints.push('')
}

export function removeWaypoint(form: OrderFormState, index: number) {
  form.waypoints.splice(index, 1)
}

export function onContainerNoInput(form: OrderFormState, val: string) {
  form.containerNo = val.toUpperCase()
}

export function onSealNoInput(form: OrderFormState, val: string) {
  form.sealNo = val.toUpperCase()
}

export function buildRequest(form: OrderFormState): CreateOrderRequest | UpdateOrderRequest {
  return {
    customerName: form.customerName || undefined,
    customerPhone: form.customerPhone || undefined,
    originName: form.originName || undefined,
    destName: form.destName || undefined,
    waypoints: form.waypoints.filter((w) => w.trim()).length > 0
      ? form.waypoints.filter((w) => w.trim())
      : undefined,
    containerNo: form.containerNo || undefined,
    containerType: (form.containerType as ContainerType) || undefined,
    sealNo: form.sealNo || undefined,
    businessType: (form.businessType as BusinessType) || undefined,
    containerStatus: (form.containerStatus as ContainerStatus) || undefined,
    documents: form.documents.length > 0 ? form.documents : undefined,
    remark: form.remark || undefined,
  }
}