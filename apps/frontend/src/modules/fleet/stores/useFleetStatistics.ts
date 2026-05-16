import { ref } from 'vue'
import { fleetService } from '../services/fleetService'
import type { FleetStatistics } from '../types/statistics'

export function useFleetStatistics() {
  const statistics = ref<FleetStatistics | null>(null)
  const statisticsLoading = ref(false)
  const statisticsError = ref<string | null>(null)

  async function fetchStatistics() {
    statisticsLoading.value = true
    statisticsError.value = null
    try {
      const result = await fleetService.getStatistics()
      statistics.value = result
    } catch (e) {
      statisticsError.value = e instanceof Error ? e.message : '获取统计数据失败'
    } finally {
      statisticsLoading.value = false
    }
  }

  function resetStatistics() {
    statistics.value = null
    statisticsLoading.value = false
    statisticsError.value = null
  }

  return {
    statistics,
    statisticsLoading,
    statisticsError,
    fetchStatistics,
    resetStatistics,
  }
}