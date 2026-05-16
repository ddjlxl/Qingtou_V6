import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { dispatchService } from '../services/dispatchService'
import type {
  Order,
  OrderStatus,
  OrderStatusCounts,
  CreateOrderRequest,
  UpdateOrderRequest,
  AssignOrderRequest,
  AvailableDriver,
  AvailableVehicle,
  DispatchAddress,
} from '../types/order'

export interface DispatchStoreState {
  orders: Ref<Order[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  activeTab: Ref<OrderStatus | 'all'>
  keyword: Ref<string>
  page: Ref<number>
  pageSize: Ref<number>
  total: Ref<number>
  statusCounts: Ref<OrderStatusCounts>
  tabCounts: ComputedRef<Record<string, number>>
  availableDrivers: Ref<AvailableDriver[]>
  availableVehicles: Ref<AvailableVehicle[]>
  addresses: Ref<DispatchAddress[]>
}

export function createDispatchState() {
  const orders = ref<Order[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeTab = ref<OrderStatus | 'all'>('all')
  const keyword = ref('')
  const page = ref(1)
  const pageSize = ref(20)
  const total = ref(0)

  const statusCounts = ref<OrderStatusCounts>({
    pending: 0,
    assigned: 0,
    transiting: 0,
    completed: 0,
    overdue: 0,
  })

  const tabCounts = computed(() => ({
    all: total.value,
    pending: statusCounts.value.pending,
    assigned: statusCounts.value.assigned,
    transiting: statusCounts.value.transiting,
    completed: statusCounts.value.completed,
    overdue: statusCounts.value.overdue,
  }))

  const availableDrivers = ref<AvailableDriver[]>([])
  const availableVehicles = ref<AvailableVehicle[]>([])
  const addresses = ref<DispatchAddress[]>([])

  return {
    orders, loading, error,
    activeTab, keyword, page, pageSize, total,
    statusCounts, tabCounts,
    availableDrivers, availableVehicles, addresses,
  }
}

async function fetchOrdersAction(s: DispatchStoreState) {
  s.loading.value = true
  s.error.value = null
  try {
    const params: Record<string, unknown> = {
      page: s.page.value,
      page_size: s.pageSize.value,
    }
    if (s.activeTab.value !== 'all') {
      params.status = s.activeTab.value
    }
    if (s.keyword.value) {
      params.keyword = s.keyword.value
    }
    const result = await dispatchService.getOrders(params)
    s.orders.value = result.items
    s.total.value = result.total
    s.statusCounts.value = result.statusCounts
  } catch (e) {
    s.error.value = e instanceof Error ? e.message : '获取任务列表失败'
  } finally {
    s.loading.value = false
  }
}

async function createOrderAction(s: DispatchStoreState, data: CreateOrderRequest) {
  s.loading.value = true
  s.error.value = null
  try {
    const order = await dispatchService.createOrder(data)
    await fetchOrdersAction(s)
    return order
  } catch (e) {
    s.error.value = e instanceof Error ? e.message : '创建任务失败'
    throw e
  } finally {
    s.loading.value = false
  }
}

async function updateOrderAction(s: DispatchStoreState, id: string, data: UpdateOrderRequest) {
  s.loading.value = true
  s.error.value = null
  try {
    const order = await dispatchService.updateOrder(id, data)
    await fetchOrdersAction(s)
    return order
  } catch (e) {
    s.error.value = e instanceof Error ? e.message : '编辑任务失败'
    throw e
  } finally {
    s.loading.value = false
  }
}

async function deleteOrderAction(s: DispatchStoreState, id: string) {
  s.loading.value = true
  s.error.value = null
  try {
    await dispatchService.deleteOrder(id)
    await fetchOrdersAction(s)
  } catch (e) {
    s.error.value = e instanceof Error ? e.message : '删除任务失败'
    throw e
  } finally {
    s.loading.value = false
  }
}

async function assignOrderAction(s: DispatchStoreState, id: string, data: AssignOrderRequest) {
  s.loading.value = true
  s.error.value = null
  try {
    const order = await dispatchService.assignOrder(id, data)
    const index = s.orders.value.findIndex((o) => o.id === id)
    if (index !== -1) {
      s.orders.value[index] = order
    }
    return order
  } catch (e) {
    s.error.value = e instanceof Error ? e.message : '分配任务失败'
    throw e
  } finally {
    s.loading.value = false
  }
}

async function completeOrderAction(s: DispatchStoreState, id: string) {
  s.loading.value = true
  s.error.value = null
  try {
    const order = await dispatchService.completeOrder(id)
    await fetchOrdersAction(s)
    return order
  } catch (e) {
    s.error.value = e instanceof Error ? e.message : '标记完成失败'
    throw e
  } finally {
    s.loading.value = false
  }
}

async function fetchAvailableResourcesAction(s: DispatchStoreState) {
  s.loading.value = true
  s.error.value = null
  try {
    const result = await dispatchService.getAvailableResources()
    s.availableDrivers.value = result.drivers
    s.availableVehicles.value = result.vehicles
  } catch (e) {
    s.error.value = e instanceof Error ? e.message : '获取可用资源失败'
  } finally {
    s.loading.value = false
  }
}

async function fetchAddressesAction(s: DispatchStoreState) {
  s.loading.value = true
  s.error.value = null
  try {
    const result = await dispatchService.getAddresses()
    s.addresses.value = result.items
  } catch (e) {
    s.error.value = e instanceof Error ? e.message : '获取常用地址失败'
  } finally {
    s.loading.value = false
  }
}

async function createAddressAction(s: DispatchStoreState, name: string) {
  s.loading.value = true
  s.error.value = null
  try {
    const address = await dispatchService.createAddress(name)
    s.addresses.value.unshift(address)
    return address
  } catch (e) {
    s.error.value = e instanceof Error ? e.message : '新增地址失败'
    throw e
  } finally {
    s.loading.value = false
  }
}

async function deleteAddressAction(s: DispatchStoreState, id: string) {
  s.loading.value = true
  s.error.value = null
  try {
    await dispatchService.deleteAddress(id)
    s.addresses.value = s.addresses.value.filter((a) => a.id !== id)
  } catch (e) {
    s.error.value = e instanceof Error ? e.message : '删除地址失败'
    throw e
  } finally {
    s.loading.value = false
  }
}

export function createStoreActions(state: DispatchStoreState) {
  const s = state

  return {
    fetchOrders: () => fetchOrdersAction(s),
    createOrder: (data: CreateOrderRequest) => createOrderAction(s, data),
    updateOrder: (id: string, data: UpdateOrderRequest) => updateOrderAction(s, id, data),
    deleteOrder: (id: string) => deleteOrderAction(s, id),
    assignOrder: (id: string, data: AssignOrderRequest) => assignOrderAction(s, id, data),
    completeOrder: (id: string) => completeOrderAction(s, id),
    fetchAvailableResources: () => fetchAvailableResourcesAction(s),
    fetchAddresses: () => fetchAddressesAction(s),
    createAddress: (name: string) => createAddressAction(s, name),
    deleteAddress: (id: string) => deleteAddressAction(s, id),
    setTab(tab: OrderStatus | 'all') {
      s.activeTab.value = tab
      s.page.value = 1
      fetchOrdersAction(s)
    },
    setKeyword(val: string) {
      s.keyword.value = val
      s.page.value = 1
      fetchOrdersAction(s)
    },
    setPage(p: number) {
      s.page.value = p
      fetchOrdersAction(s)
    },
    setPageSize(ps: number) {
      s.pageSize.value = ps
      s.page.value = 1
      fetchOrdersAction(s)
    },
  }
}