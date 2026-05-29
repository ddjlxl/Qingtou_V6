<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { VehicleLocation, VehicleDashboardStatus, StatusCounts } from '../types'
import EmptyState from '@/shared/components/EmptyState.vue'
import StatusOverview from './StatusOverview.vue'

const props = defineProps<{
  vehicles: VehicleLocation[]
  statusCounts: StatusCounts
  selectedVehicleId: string | null
}>()

const emit = defineEmits<{
  'select-vehicle': [id: string]
}>()

const searchQuery = ref('')
const listRef = ref<HTMLElement | null>(null)

const STATUS_LABELS: Record<VehicleDashboardStatus, string> = {
  idle: '空闲',
  transiting: '运输中',
  overdue: '超时',
}

const STATUS_TAG_TYPES: Record<VehicleDashboardStatus, 'info' | 'primary' | 'danger'> = {
  idle: 'info',
  transiting: 'primary',
  overdue: 'danger',
}

const filteredVehicles = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return props.vehicles

  return props.vehicles.filter(
    (v) =>
      v.plateNo.toLowerCase().includes(query) ||
      (v.driverName && v.driverName.toLowerCase().includes(query)),
  )
})

const isSearchEmpty = computed(
  () => searchQuery.value.trim() !== '' && filteredVehicles.value.length === 0,
)

const isListEmpty = computed(
  () => props.vehicles.length === 0,
)

function handleItemClick(id: string) {
  emit('select-vehicle', id)
}

watch(
  () => props.selectedVehicleId,
  async (id) => {
    if (!id || !listRef.value) return

    await nextTick()
    const selectedEl = listRef.value.querySelector('.fleet-panel__item--selected')
    if (selectedEl) {
      selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  },
)
</script>

<template>
  <div class="fleet-panel">
    <div class="fleet-panel__search">
      <el-input
        v-model="searchQuery"
        placeholder="搜索车牌号/司机姓名"
        clearable
        size="small"
      />
    </div>

    <div
      v-if="isListEmpty"
      class="fleet-panel__empty"
    >
      <EmptyState
        icon="FolderOpened"
        title="暂无车辆信息"
      />
    </div>

    <div
      v-else-if="isSearchEmpty"
      class="fleet-panel__empty"
    >
      <EmptyState
        icon="Search"
        title="未找到匹配车辆"
      />
    </div>

    <div
      v-else
      ref="listRef"
      class="fleet-panel__list"
    >
      <div
        v-for="vehicle in filteredVehicles"
        :key="vehicle.id"
        class="fleet-panel__item"
        :class="{ 'fleet-panel__item--selected': vehicle.id === selectedVehicleId }"
        @click="handleItemClick(vehicle.id)"
      >
        <div class="fleet-panel__item-info">
          <span class="fleet-panel__plate">{{ vehicle.plateNo }}</span>
          <span class="fleet-panel__driver">{{ vehicle.driverName ?? '未分配' }}</span>
        </div>
        <el-tag
          :type="STATUS_TAG_TYPES[vehicle.status]"
          size="small"
        >
          {{ STATUS_LABELS[vehicle.status] }}
        </el-tag>
      </div>
    </div>

    <StatusOverview :status-counts="statusCounts" />
  </div>
</template>

<style scoped>
.fleet-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
  width: 280px;
  max-height: calc(100% - 32px);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fleet-panel__search {
  padding: 12px 12px 0;
  flex-shrink: 0;
}

.fleet-panel__empty {
  padding: 16px;
  flex-shrink: 0;
}

.fleet-panel__list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.fleet-panel__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.fleet-panel__item:hover {
  background-color: #f5f7fa;
}

.fleet-panel__item--selected {
  background-color: #ecf5ff;
}

.fleet-panel__item-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.fleet-panel__plate {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fleet-panel__driver {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
</style>
