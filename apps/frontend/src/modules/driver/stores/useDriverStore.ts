import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { driverService } from '../services/driverService'
import type { DriverOrder, DriverOrderListParams } from '../types'
import type { OrderStatus, OrderStatusCounts } from '@/modules/dispatch/types/order'

export const useDriverStore = defineStore('driver', () => {
  const orders = ref<DriverOrder[]>([])
  const loading = ref(false)
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
    try {
      const params: DriverOrderListParams = {
        page: page.value,
        pageSize: pageSize.value,
      }
      if (activeTab.value !== 'all') {
        params.status = activeTab.value
      }
      const result = await driverService.getOrders(params)
      orders.value = result.items
      total.value = result.total
      statusCounts.value = result.statusCounts
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取任务列表失败'
    } finally {
      loading.value = false
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
    orders, loading, error,
    page, pageSize, total,
    activeTab, statusCounts, tabCounts,
    fetchOrders, startOrder, completeOrder,
    setTab, setPage,
  }
})
