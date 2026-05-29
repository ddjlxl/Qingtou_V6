import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardService } from '../services/dashboardService'
import type { DashboardData } from '../types'

export const useDashboardStore = defineStore('dashboard', () => {
  const data = ref<DashboardData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchDashboard() {
    loading.value = true
    error.value = null
    try {
      const res = await dashboardService.getDashboard()
      data.value = res
    } catch {
      error.value = '获取看板数据失败'
    } finally {
      loading.value = false
    }
  }

  function resetState() {
    data.value = null
    loading.value = false
    error.value = null
  }

  return { data, loading, error, fetchDashboard, resetState }
})
