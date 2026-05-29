<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardStats } from '../types'

const props = defineProps<{
  stats: DashboardStats
}>()

const completionPercent = computed(() =>
  Math.round(props.stats.completionRate * 100)
)

const transportDisplay = computed(() => {
  if (props.stats.avgTransportMinutes === null) return '--'
  return `${props.stats.avgTransportMinutes}分钟`
})

const isOverdue = computed(() => props.stats.overdueCount > 0)
</script>

<template>
  <div class="statistics-overlay">
    <div class="statistics-overlay__inner">
      <el-row :gutter="12">
        <el-col :span="6">
          <div class="stat-card">
            <span class="stat-card__value">{{ stats.todayTaskCount }}</span>
            <span class="stat-card__label">今日任务</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <span class="stat-card__value">{{ completionPercent }}%</span>
            <span class="stat-card__label">完成率</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <span
              class="stat-card__value"
              :class="{ 'stat-card__value--danger': isOverdue }"
            >
              {{ stats.overdueCount }}
            </span>
            <span class="stat-card__label">超时</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <span class="stat-card__value">{{ transportDisplay }}</span>
            <span class="stat-card__label">平均转运</span>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
.statistics-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 1000;
  pointer-events: none;
}

.statistics-overlay__inner {
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.stat-card__value {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-card__value--danger {
  color: #f56c6c;
}

.stat-card__label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
