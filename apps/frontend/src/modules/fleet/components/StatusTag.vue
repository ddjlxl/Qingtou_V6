<script setup lang="ts">
import { computed } from 'vue'
import { VehicleStatus } from '../types/vehicle'

const props = defineProps<{
  status: VehicleStatus
}>()

const statusConfig = computed(() => {
  switch (props.status) {
    case VehicleStatus.IDLE:
      return { type: 'success' as const, label: '空闲' }
    case VehicleStatus.TRANSITING:
      return { type: '' as const, label: '运输中' }
    case VehicleStatus.OVERDUE:
      return { type: 'danger' as const, label: '超时' }
    default:
      return { type: 'info' as const, label: props.status }
  }
})
</script>

<template>
  <el-tag
    :type="statusConfig.type"
    size="small"
  >
    {{ statusConfig.label }}
  </el-tag>
</template>