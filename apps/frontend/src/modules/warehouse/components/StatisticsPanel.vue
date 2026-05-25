<script setup lang="ts">
import { computed } from 'vue'
import type { WarehouseStatistics } from '../types'

const props = defineProps<{
  stats: WarehouseStatistics
}>()

const utilizationPercent = computed(() =>
  (props.stats.utilizationRate * 100).toFixed(1)
)
</script>

<template>
  <div class="statistics-panel">
    <div class="stat-item">
      <span class="stat-item__value">{{ stats.totalSlots }}</span>
      <span class="stat-item__label">总库位</span>
    </div>
    <div class="stat-item">
      <span class="stat-item__value stat-item__value--primary">{{ stats.usedSlots }}</span>
      <span class="stat-item__label">已占用</span>
    </div>
    <div class="stat-item">
      <span class="stat-item__value stat-item__value--success">{{ stats.availableSlots }}</span>
      <span class="stat-item__label">空闲</span>
    </div>
    <div class="stat-item">
      <span class="stat-item__value stat-item__value--warning">{{ stats.heavyCount }}</span>
      <span class="stat-item__label">重箱</span>
    </div>
    <div class="stat-item">
      <span class="stat-item__value stat-item__value--info">{{ stats.emptyContainerCount }}</span>
      <span class="stat-item__label">空箱</span>
    </div>
    <div class="stat-item">
      <span class="stat-item__value">{{ utilizationPercent }}%</span>
      <span class="stat-item__label">利用率</span>
    </div>
  </div>
</template>

<style scoped>
.statistics-panel {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.stat-item__value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.stat-item__value--primary { color: #409eff; }
.stat-item__value--success { color: #67c23a; }
.stat-item__value--warning { color: #e6a23c; }
.stat-item__value--info { color: #909399; }

.stat-item__label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
