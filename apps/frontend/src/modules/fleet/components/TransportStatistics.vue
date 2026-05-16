<script setup lang="ts">
import type { TransportRecordStatistics } from '../types/transport-record'

defineProps<{
  statistics: TransportRecordStatistics | null
}>()
</script>

<template>
  <div
    v-if="statistics"
    class="transport-statistics"
  >
    <div class="statistics-group">
      <div class="statistics-title">
        司机任务统计
      </div>
      <div
        v-for="item in statistics.byDriver"
        :key="item.driverId"
        class="statistics-item"
      >
        <span>{{ item.driverName }}</span>
        <el-tag type="primary">
          {{ item.count }} 单
        </el-tag>
      </div>
      <div
        v-if="statistics.byDriver.length === 0"
        class="statistics-empty"
      >
        暂无数据
      </div>
    </div>
    <div class="statistics-group">
      <div class="statistics-title">
        车辆任务统计
      </div>
      <div
        v-for="item in statistics.byVehicle"
        :key="item.vehicleId"
        class="statistics-item"
      >
        <span>{{ item.vehiclePlateNo }}</span>
        <el-tag type="success">
          {{ item.count }} 单
        </el-tag>
      </div>
      <div
        v-if="statistics.byVehicle.length === 0"
        class="statistics-empty"
      >
        暂无数据
      </div>
    </div>
  </div>
</template>

<style scoped>
.transport-statistics {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.statistics-group {
  flex: 1;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 12px 16px;
}

.statistics-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.statistics-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 14px;
}

.statistics-empty {
  font-size: 13px;
  color: #c0c4cc;
}
</style>