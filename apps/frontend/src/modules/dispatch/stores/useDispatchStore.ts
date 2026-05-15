import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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

export const useDispatchStore = defineStore('dispatch', () => {
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

  async function fetchOrders() {
    loading.value = true
    error.value = null
    try {
      const params: Record<string, unknown> = {
        page: page.value,
        page_size: pageSize.value,
      }
      if (activeTab.value !== 'all') {
        params.status = activeTab.value
      }
      if (keyword.value) {
        params.keyword = keyword.value
      }
      const result = await dispatchService.getOrders(params)
      orders.value = result.items
      total.value = result.total
      statusCounts.value = result.statusCounts
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取任务列表失败'
    } finally {
      loading.value = false
    }
  }

  async function createOrder(data: CreateOrderRequest) {
    loading.value = true
    error.value = null
    try {
      const order = await dispatchService.createOrder(data)
      await fetchOrders()
      return order
    } catch (e) {
      error.value = e instanceof Error ? e.message : '创建任务失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateOrder(id: string, data: UpdateOrderRequest) {
    loading.value = true
    error.value = null
    try {
      const order = await dispatchService.updateOrder(id, data)
      await fetchOrders()
      return order
    } catch (e) {
      error.value = e instanceof Error ? e.message : '编辑任务失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteOrder(id: string) {
    loading.value = true
    error.value = null
    try {
      await dispatchService.deleteOrder(id)
      await fetchOrders()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除任务失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function assignOrder(id: string, data: AssignOrderRequest) {
    loading.value = true
    error.value = null
    try {
      const order = await dispatchService.assignOrder(id, data)
      const index = orders.value.findIndex((o) => o.id === id)
      if (index !== -1) {
        orders.value[index] = order
      }
      return order
    } catch (e) {
      error.value = e instanceof Error ? e.message : '分配任务失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function completeOrder(id: string) {
    loading.value = true
    error.value = null
    try {
      const order = await dispatchService.completeOrder(id)
      await fetchOrders()
      return order
    } catch (e) {
      error.value = e instanceof Error ? e.message : '标记完成失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchAvailableResources() {
    try {
      const result = await dispatchService.getAvailableResources()
      availableDrivers.value = result.drivers
      availableVehicles.value = result.vehicles
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取可用资源失败'
    }
  }

  async function fetchAddresses() {
    try {
      const result = await dispatchService.getAddresses()
      addresses.value = result.items
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取常用地址失败'
    }
  }

  async function createAddress(name: string) {
    try {
      const address = await dispatchService.createAddress(name)
      addresses.value.unshift(address)
      return address
    } catch (e) {
      error.value = e instanceof Error ? e.message : '新增地址失败'
      throw e
    }
  }

  async function deleteAddress(id: string) {
    try {
      await dispatchService.deleteAddress(id)
      addresses.value = addresses.value.filter((a) => a.id !== id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除地址失败'
      throw e
    }
  }

  function setTab(tab: OrderStatus | 'all') {
    activeTab.value = tab
    page.value = 1
    fetchOrders()
  }

  function setKeyword(val: string) {
    keyword.value = val
    page.value = 1
    fetchOrders()
  }

  function setPage(p: number) {
    page.value = p
    fetchOrders()
  }

  function setPageSize(ps: number) {
    pageSize.value = ps
    page.value = 1
    fetchOrders()
  }

  return {
    orders,
    loading,
    error,
    activeTab,
    keyword,
    page,
    pageSize,
    total,
    statusCounts,
    tabCounts,
    availableDrivers,
    availableVehicles,
    addresses,
    fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    assignOrder,
    completeOrder,
    fetchAvailableResources,
    fetchAddresses,
    createAddress,
    deleteAddress,
    setTab,
    setKeyword,
    setPage,
    setPageSize,
  }
})