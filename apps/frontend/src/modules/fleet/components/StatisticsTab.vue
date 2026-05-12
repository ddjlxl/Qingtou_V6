<script setup lang="ts">
import { onMounted } from 'vue'
import { useFleetStore } from '../stores/useFleetStore'

const emit = defineEmits<{
  'tab-change': [tab: string]
}>()

const store = useFleetStore()

onMounted(() => {
  store.fetchStatistics()
})

function goToCertificate() {
  emit('tab-change', 'certificate')
}
</script>

<template>
  <div class="statistics-tab">
    <div
      v-if="store.statisticsLoading"
      class="statistics-loading"
    >
      <el-skeleton
        :rows="2"
        animated
      />
    </div>
    <el-row
      v-else
      :gutter="20"
    >
      <el-col :span="12">
        <div
          class="stat-card stat-card--warning"
          @click="goToCertificate"
        >
          <div class="stat-card__label">
            证照预警
          </div>
          <div class="stat-card__value">
            {{ store.statistics?.certificateWarningCount ?? 0 }}
          </div>
          <div class="stat-card__desc">
            30天内到期证照数
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="stat-card stat-card--task">
          <div class="stat-card__label">
            本月任务
          </div>
          <div class="stat-card__value">
            {{ store.statistics?.monthTaskCount ?? 0 }}
          </div>
          <div class="stat-card__desc">
            本月运输任务数
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.statistics-tab {
  padding: 16px 0;
}

.statistics-loading {
  padding: 16px;
}

.stat-card {
  padding: 24px;
  border-radius: 8px;
  cursor: default;
  transition: box-shadow 0.3s;
}

.stat-card--warning {
  background: #fef0f0;
  border: 1px solid #fde2e2;
  cursor: pointer;
}

.stat-card--warning:hover {
  box-shadow: 0 2px 12px rgba(245, 108, 108, 0.3);
}

.stat-card--task {
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
}

.stat-card__label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-card__value {
  font-size: 36px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-card--warning .stat-card__value {
  color: #f56c6c;
}

.stat-card--task .stat-card__value {
  color: #67c23a;
}

.stat-card__desc {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 8px;
}
</style>