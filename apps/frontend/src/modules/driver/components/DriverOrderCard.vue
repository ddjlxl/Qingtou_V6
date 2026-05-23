<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDriverStore } from '../stores/useDriverStore'
import { OrderStatus, ContainerStatus } from '@/modules/dispatch'
import type { DriverOrder } from '../types'

defineProps<{
  order: DriverOrder
}>()

const store = useDriverStore()

const statusTagType: Record<string, 'info' | 'warning' | 'primary' | 'success' | 'danger'> = {
  [OrderStatus.PENDING]: 'info',
  [OrderStatus.ASSIGNED]: 'warning',
  [OrderStatus.TRANSITING]: 'primary',
  [OrderStatus.COMPLETED]: 'success',
  [OrderStatus.OVERDUE]: 'danger',
}

const statusLabel: Record<string, string> = {
  [OrderStatus.PENDING]: '待分配',
  [OrderStatus.ASSIGNED]: '待发车',
  [OrderStatus.TRANSITING]: '运输中',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.OVERDUE]: '超时',
}

function canStart(order: DriverOrder): boolean {
  return order.status === OrderStatus.ASSIGNED
}

function canComplete(order: DriverOrder): boolean {
  return order.status === OrderStatus.TRANSITING
}

async function handleStart(order: DriverOrder) {
  try {
    await ElMessageBox.confirm(
      `确认开始运输任务 ${order.orderNo}？`,
      '开始运输',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' },
    )
    await store.startOrder(order.id)
    ElMessage.success('已开始运输')
  } catch {
    // 用户取消
  }
}

async function handleComplete(order: DriverOrder) {
  try {
    await ElMessageBox.confirm(
      `确认完成任务 ${order.orderNo}？`,
      '完成任务',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' },
    )
    await store.completeOrder(order.id)
    ElMessage.success('任务已完成')
  } catch {
    // 用户取消
  }
}

function containerStatusLabel(status: string | null): string {
  if (status === ContainerStatus.HEAVY) return '重箱'
  if (status === ContainerStatus.EMPTY) return '空箱'
  return '-'
}
</script>

<template>
  <div class="driver-order-card">
    <div class="driver-order-card__header">
      <span class="driver-order-card__order-no">{{ order.orderNo }}</span>
      <el-tag
        :type="statusTagType[order.status] ?? 'info'"
        size="small"
      >
        {{ statusLabel[order.status] ?? order.status }}
      </el-tag>
    </div>

    <div class="driver-order-card__body">
      <div class="driver-order-card__info-row">
        <span class="driver-order-card__label">客户</span>
        <span class="driver-order-card__value">{{ order.customerName || '-' }}</span>
      </div>
      <div class="driver-order-card__info-row">
        <span class="driver-order-card__label">路线</span>
        <span class="driver-order-card__value">
          {{ order.originName || '-' }} → {{ order.destName || '-' }}
        </span>
      </div>
      <div class="driver-order-card__info-row">
        <span class="driver-order-card__label">箱号</span>
        <span class="driver-order-card__value">{{ order.containerNo || '-' }}</span>
      </div>
      <div class="driver-order-card__info-row">
        <span class="driver-order-card__label">空重箱</span>
        <span class="driver-order-card__value">{{ containerStatusLabel(order.containerStatus) }}</span>
      </div>
      <div class="driver-order-card__info-row">
        <span class="driver-order-card__label">车牌</span>
        <span class="driver-order-card__value">{{ order.vehiclePlateNo || '-' }}</span>
      </div>
    </div>

    <div
      v-if="canStart(order) || canComplete(order)"
      class="driver-order-card__actions"
    >
      <el-button
        v-if="canStart(order)"
        type="primary"
        size="small"
        @click="handleStart(order)"
      >
        开始运输
      </el-button>
      <el-button
        v-if="canComplete(order)"
        type="success"
        size="small"
        @click="handleComplete(order)"
      >
        完成任务
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.driver-order-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.driver-order-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.driver-order-card__order-no {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.driver-order-card__body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 24px;
}

.driver-order-card__info-row {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.driver-order-card__label {
  color: #909399;
  width: 56px;
  flex-shrink: 0;
}

.driver-order-card__value {
  color: #606266;
}

.driver-order-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

@media (max-width: 767px) {
  .driver-order-card__body {
    grid-template-columns: 1fr;
  }

  .driver-order-card__actions .el-button {
    min-height: 44px;
    min-width: 40%;
    font-size: 15px;
  }
}
</style>
