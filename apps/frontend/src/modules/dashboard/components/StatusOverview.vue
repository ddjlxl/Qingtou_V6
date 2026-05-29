<script setup lang="ts">
import type { StatusCounts } from '../types'

const props = defineProps<{
  statusCounts: StatusCounts
}>()

const statusItems = [
  { key: 'pending' as const, label: '待分配', type: 'info' as const },
  { key: 'assigned' as const, label: '已分配', type: 'warning' as const },
  { key: 'transiting' as const, label: '运输中', type: 'primary' as const },
  { key: 'completed' as const, label: '已完成', type: 'success' as const },
  { key: 'overdue' as const, label: '超时', type: 'danger' as const },
]
</script>

<template>
  <div class="status-overview">
    <div class="status-overview__title">
      状态概览
    </div>
    <div
      v-for="item in statusItems"
      :key="item.key"
      class="status-overview__row"
    >
      <el-tag
        :type="item.type"
        size="small"
      >
        {{ item.label }}
      </el-tag>
      <span class="status-overview__count">{{ props.statusCounts[item.key] }}</span>
    </div>
  </div>
</template>

<style scoped>
.status-overview {
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
  margin-top: 12px;
}

.status-overview__title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.status-overview__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.status-overview__count {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
</style>
