<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useDashboardStore } from '../stores/useDashboardStore'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import StatisticsOverlay from '../components/StatisticsOverlay.vue'
import MapArea from '../components/MapArea.vue'
import FleetPanel from '../components/FleetPanel.vue'

const REFRESH_INTERVAL = 30_000

const store = useDashboardStore()
const selectedVehicleId = ref<string | null>(null)
let refreshTimer: ReturnType<typeof setInterval> | null = null

function startRefreshTimer() {
  stopRefreshTimer()
  refreshTimer = setInterval(() => store.fetchDashboard(), REFRESH_INTERVAL)
}

function stopRefreshTimer() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

function handleManualRefresh() {
  store.fetchDashboard()
  startRefreshTimer()
}

watch(() => store.error, (newError) => {
  if (newError && store.data) {
    ElMessage.error(newError)
  }
})

onMounted(() => {
  store.fetchDashboard()
  startRefreshTimer()
})

onUnmounted(() => {
  stopRefreshTimer()
})
</script>

<template>
  <div class="dashboard-page">
    <LoadingSpinner
      v-if="store.loading && !store.data"
      fullscreen
      text="加载看板数据..."
    />
    <div
      v-else-if="store.error && !store.data"
      class="dashboard-page__error"
    >
      <el-result
        icon="error"
        title="加载失败"
        :sub-title="store.error"
      >
        <template #extra>
          <el-button
            type="primary"
            :loading="store.loading"
            @click="store.fetchDashboard()"
          >
            重新加载
          </el-button>
        </template>
      </el-result>
    </div>
    <div
      v-else-if="store.data"
      class="dashboard-page__content"
    >
      <el-button
        class="dashboard-page__refresh-btn"
        :loading="store.loading"
        circle
        @click="handleManualRefresh"
      >
        <el-icon><Refresh /></el-icon>
      </el-button>
      <StatisticsOverlay :stats="store.data.stats" />
      <MapArea
        :vehicles="store.data.vehicles"
        :selected-vehicle-id="selectedVehicleId"
        @select-vehicle="selectedVehicleId = $event"
      />
      <FleetPanel
        :vehicles="store.data.vehicles"
        :status-counts="store.data.statusCounts"
        :selected-vehicle-id="selectedVehicleId"
        @select-vehicle="selectedVehicleId = $event"
      />
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  position: relative;
  width: 100%;
  height: 100%;
}

.dashboard-page__error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.dashboard-page__content {
  width: 100%;
  height: 100%;
  position: relative;
}

.dashboard-page__refresh-btn {
  position: absolute;
  top: 16px;
  right: 308px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
}
</style>
