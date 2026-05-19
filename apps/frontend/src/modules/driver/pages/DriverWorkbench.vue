<script setup lang="ts">
import { onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDriverStore } from '../stores/useDriverStore'
import { EmptyState } from '@/shared/components'
import { OrderStatus, ContainerStatus } from '@/modules/dispatch/types/order'
import type { DriverOrder } from '../types'

const store = useDriverStore()

onMounted(() => {
  store.fetchOrders()
})

const STATUS_TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '待发车', value: OrderStatus.ASSIGNED },
  { label: '运输中', value: OrderStatus.TRANSITING },
  { label: '已完成', value: OrderStatus.COMPLETED },
]

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
  <div class="driver-workbench">
    <div class="driver-workbench__header">
      <h2>我的任务</h2>
    </div>

    <div class="driver-workbench__tabs">
      <el-radio-group
        :model-value="store.activeTab"
        @change="store.setTab"
      >
        <el-radio-button
          v-for="tab in STATUS_TABS"
          :key="tab.value"
          :value="tab.value"
        >
          {{ tab.label }}
          <span class="driver-workbench__count">
            ({{ store.tabCounts[tab.value] ?? 0 }})
          </span>
        </el-radio-button>
      </el-radio-group>
    </div>

    <div
      v-loading="store.loading"
      class="driver-workbench__content"
    >
      <EmptyState
        v-if="!store.loading && store.orders.length === 0"
        icon="FolderOpened"
        title="暂无任务"
        description="当前没有分配给您的任务"
      />

      <div
        v-for="order in store.orders"
        :key="order.id"
        class="driver-workbench__card"
      >
        <div class="driver-workbench__card-header">
          <span class="driver-workbench__order-no">{{ order.orderNo }}</span>
          <el-tag
            :type="statusTagType[order.status] ?? 'info'"
            size="small"
          >
            {{ statusLabel[order.status] ?? order.status }}
          </el-tag>
        </div>

        <div class="driver-workbench__card-body">
          <div class="driver-workbench__info-row">
            <span class="driver-workbench__label">客户</span>
            <span class="driver-workbench__value">{{ order.customerName || '-' }}</span>
          </div>
          <div class="driver-workbench__info-row">
            <span class="driver-workbench__label">路线</span>
            <span class="driver-workbench__value">
              {{ order.originName || '-' }} → {{ order.destName || '-' }}
            </span>
          </div>
          <div class="driver-workbench__info-row">
            <span class="driver-workbench__label">箱号</span>
            <span class="driver-workbench__value">{{ order.containerNo || '-' }}</span>
          </div>
          <div class="driver-workbench__info-row">
            <span class="driver-workbench__label">空重箱</span>
            <span class="driver-workbench__value">{{ containerStatusLabel(order.containerStatus) }}</span>
          </div>
          <div class="driver-workbench__info-row">
            <span class="driver-workbench__label">车牌</span>
            <span class="driver-workbench__value">{{ order.vehiclePlateNo || '-' }}</span>
          </div>
        </div>

        <div
          v-if="canStart(order) || canComplete(order)"
          class="driver-workbench__card-actions"
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

      <div
        v-if="store.total > store.pageSize"
        class="driver-workbench__pagination"
      >
        <el-pagination
          :current-page="store.page"
          :page-size="store.pageSize"
          :total="store.total"
          layout="prev, pager, next"
          @current-change="store.setPage"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.driver-workbench {
  padding: 20px;
}

.driver-workbench__header h2 {
  margin: 0 0 16px;
  font-size: 20px;
  color: #303133;
}

.driver-workbench__tabs {
  margin-bottom: 20px;
}

.driver-workbench__count {
  margin-left: 4px;
  font-size: 12px;
  opacity: 0.7;
}

.driver-workbench__content {
  min-height: 200px;
}

.driver-workbench__card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.driver-workbench__card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.driver-workbench__order-no {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.driver-workbench__card-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 24px;
}

.driver-workbench__info-row {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.driver-workbench__label {
  color: #909399;
  width: 56px;
  flex-shrink: 0;
}

.driver-workbench__value {
  color: #606266;
}

.driver-workbench__card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.driver-workbench__pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
