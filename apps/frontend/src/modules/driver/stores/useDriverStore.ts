import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { driverService } from '../services/driverService'
import type { DriverOrder, DriverOrderListParams } from '../types'
import type { OrderStatus, OrderStatusCounts } from '@/modules/dispatch/types/order'

let requestId = 0

export const useDriverStore = defineStore('driver', () => {
  const orders = ref<DriverOrder[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const page = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const activeTab = ref<OrderStatus | 'all'>('all')
  const statusCounts = ref<OrderStatusCounts>({
    pending: 0,
    assigned: 0,
    transiting: 0,
    completed: 0,
    overdue: 0,
  })

  const hasMore = computed(() => orders.value.length < total.value)

  const tabCounts = computed(() => ({
    all: total.value,
    pending: statusCounts.value.pending,
    assigned: statusCounts.value.assigned,
    transiting: statusCounts.value.transiting,
    completed: statusCounts.value.completed,
    overdue: statusCounts.value.overdue,
  }))

  async function fetchOrders() {
    loading.value = true
    error.value = null
    const currentRequestId = ++requestId
    try {
      const params: DriverOrderListParams = {
        page: page.value,
        pageSize: pageSize.value,
      }
      if (activeTab.value !== 'all') {
        params.status = activeTab.value
      }
      const result = await driverService.getOrders(params)
      if (currentRequestId !== requestId) return
      orders.value = result.items
      total.value = result.total
      statusCounts.value = result.statusCounts
    } catch (e) {
      if (currentRequestId !== requestId) return
      error.value = e instanceof Error ? e.message : '获取任务列表失败'
    } finally {
      if (currentRequestId === requestId) {
        loading.value = false
      }
    }
  }

  async function loadMore() {
    if (loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    const currentRequestId = ++requestId
    try {
      page.value++
      const params: DriverOrderListParams = {
        page: page.value,
        pageSize: pageSize.value,
      }
      if (activeTab.value !== 'all') {
        params.status = activeTab.value
      }
      const result = await driverService.getOrders(params)
      if (currentRequestId !== requestId) return
      orders.value.push(...result.items)
    } catch (e) {
      if (currentRequestId !== requestId) return
      page.value--
      error.value = e instanceof Error ? e.message : '加载失败'
    } finally {
      if (currentRequestId === requestId) {
        loadingMore.value = false
      }
    }
  }

  async function startOrder(orderId: string) {
    loading.value = true
    error.value = null
    try {
      await driverService.startOrder(orderId)
      await fetchOrders()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '开始运输失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function completeOrder(orderId: string) {
    loading.value = true
    error.value = null
    try {
      await driverService.completeOrder(orderId)
      await fetchOrders()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '完成任务失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  function setTab(tab: OrderStatus | 'all') {
    activeTab.value = tab
    page.value = 1
    fetchOrders()
  }

  function setPage(p: number) {
    page.value = p
    fetchOrders()
  }

  return {
    orders, loading, loadingMore, error,
    page, pageSize, total,
    activeTab, statusCounts, tabCounts,
    hasMore,
    fetchOrders, loadMore, startOrder, completeOrder,
    setTab, setPage,
  }
})
